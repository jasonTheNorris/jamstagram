(function() {

  var J = {
    Templates: {},
    Utils: {},
    Models: {},
    Views: {},
    INSTAGRAM_BASE_URL: 'https://api.instagram.com/v1',
    INSTAGRAM_CLIENT_ID: 'a8d683aca6dd4263b5bc0bf04ba5d6ec'
  };

  // Utils
  J.Utils.buildQueryString = function(args) {
    return '?' + _.map(args, function(v, k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(v);
    }).join('&');
  };

  J.Utils.setInstagramAccessToken = function(token) {
    $.cookie('ig_token', token, { path: '/' });
    $(J.app).trigger('auth:instagram');
  };

  J.Utils.instagramRequest = function(path, args, method) {    
    var buildUrl = function() {
      args = args || {};
      var accessToken = $.cookie('ig_token');

      if (accessToken) {
        args.access_token = accessToken;
      } else {
        args.client_id = J.INSTAGRAM_CLIENT_ID;
      }
    
      return J.INSTAGRAM_BASE_URL + path + J.Utils.buildQueryString(args);
    };

    var url = buildUrl();
    var deferred = $.Deferred();
    var requestArgs = {
      type: method || 'get',
      dataType: 'jsonp',
      url: url
    };

    $.ajax(requestArgs).success(function(response) {
      if (response.meta.code === 200) {
        deferred.resolve(response);
      } else if (response.meta.error_type === 'OAuthAccessTokenException') {
        J.Utils.authInstagram(true).done(function() {
          requestArgs.url = buildUrl();
          $.ajax(requestArgs).success(function(response) {
            deferred.resolve(response);
          });
        });
      }
    });

    return deferred;
  };

  J.Utils.authInstagram = function(forceAuth) {
    var deferred = $.Deferred();
    var accessToken = $.cookie('ig_token');

    if (accessToken && !forceAuth) {
      deferred.resolve();
    } else {
      var authUrl = [
        'https://instagram.com/oauth/authorize/?client_id=',
        J.INSTAGRAM_CLIENT_ID,
        '&redirect_uri=',
        encodeURIComponent('http://local.jamstagr.am:4567/#create'),
        '&response_type=token'
      ].join('');
      var authWindow = window.open(authUrl, 'instagramAuth', "height=650,width=650");
      $(J.app).one('auth:instagram', function() {
        authWindow.close();
        deferred.resolve();
      });
    }

    return deferred;
  };

  J.Utils.formatDuration = function(duration) {
    var hours = Math.floor(duration / (60 * 60));
    var minutes = Math.floor((duration - (hours * 60 * 60)) / 60);
    var seconds = duration - (hours * 60 * 60) - (minutes * 60);
    if (!seconds) {
      seconds = "00";
    } else if (seconds < 10) {
      seconds = "0" + seconds;
    }
    if (!minutes) {
      minutes = "0";
    }
    return _.compact([hours, minutes, seconds]).join(':');
  };

  // Models
  J.Models.JamstagramCollection = Backbone.Collection.extend({
    model: Backbone.Model,
    url: '/api/jamstagrams'
  });

  // Views
  J.Views.Index = Backbone.View.extend({
    className: 'Index clearfix',
    render: function() {
      R.ready(function() {
        J.app.setHeaderButtonState('add');
      });
      this.$el.html(J.Templates.index.render({ jamstagrams: this.model.toJSON() }));
      return this;
    }
  });

  J.Views.Create = Backbone.View.extend({
    className: 'Create clearfix',

    events: {
      'keyup .instagram-search': 'onInstagramSearchKepUp',
      'click .instagram-results img': 'onInstagramResultClicked',
      'click .photo-shield .nav': 'onPhotoShieldNavClicked',
      'click .photo-shield .select': 'onPhotoShieldSelectClicked'
    },

    initialize: function() {
      this.rdio = new J.Views.Rdio({
        model: new Backbone.Collection(),
        el: this.$('.two').get(0)
      });

      this.photos = new Backbone.Collection();
      this.photos.on('reset', this.onPhotosReset, this);
    },

    render: function() {
      J.app.setHeaderButtonState('remove');
      this.$el.html(J.Templates.create.render());
      this.$('.step.two').append(this.rdio.render().el);
      return this;
    },

    onInstagramSearchKepUp: function(e) {
      if (e.keyCode !== 13) {
        return;
      }

      var self = this;
      var query = $(e.currentTarget).val();

      if (query.charAt(0) === '@') {
        J.Utils.authInstagram().done(function() {
          J.Utils.instagramRequest('/users/search/', {
            q: query.slice(1)
          }).done(function(response) {
            var userId = response.data[0].id;
            var path = '/users/' + userId + '/media/recent/';
            
            J.Utils.instagramRequest(path).done(function(response) {
              self.photos.reset(response.data);
            });
          });
        });
      } else {
        var path = '/tags/' + query.replace(/^#/, '') + '/media/recent';
        J.Utils.instagramRequest(path).done(function(response) {
          self.photos.reset(response.data);
        });
      }
    },

    onPhotosReset: function(data) {
      var data = this.photos.map(function(photo, index) {
        return {
          src: photo.get('images').thumbnail.url,
          index: index
        };
      });
      var photoGrid = J.Templates.photoGrid.render({ photos: data });
      this.$('.instagram-results').html(photoGrid);
    },

    onInstagramResultClicked: function(e) {
      this.currentPhotoIndex = $(e.currentTarget).attr('data-index');
      var $shield = this.$('.photo-shield');
      var $shieldImage = $shield.find('img');
      
      $shieldImage.one('load', function() {
        $shield.fadeIn();
      });
      
      this.loadShieldPhoto();
    },

    onPhotoShieldNavClicked: function(e) {
      if ($(e.currentTarget).is('.next')) {
        if (this.currentPhotoIndex !== this.photos.length - 1) {
          this.currentPhotoIndex++;
        }
      } else if (this.currentPhotoIndex !== 0) {
        this.currentPhotoIndex--;
      }
      this.loadShieldPhoto();
    },

    loadShieldPhoto: function() {
      var src = this.photos.at(this.currentPhotoIndex).get('images').standard_resolution.url;
      this.$('.photo-shield img').attr('src', src);
    },

    onPhotoShieldSelectClicked: function() {
      this.$('.photo-shield .controls').fadeOut();
      this.$('.step.one .number').addClass('complete');
    }

  });

  // App
  J.App = function() {
    var self = this;

    $.getJSON('/api/templates', function(data) {
      _.each(data, function(template, name) {
        J.Templates[name] = Hogan.compile(template);
      });
      self.init();
    });
  };

  J.App.prototype.init = function() {
    var self = this;

    var Router = Backbone.Router.extend({
      routes: {
        '': 'index',
        'create': 'create',
        'access_token=*token': 'instagram_auth'
      },

      index: function() {
        var model = new J.Models.JamstagramCollection();
        var view = new J.Views.Index({
          model: model
        });

        model.on('reset', function() {
          self.renderContent(view);
        });
        model.fetch();

        self.renderContent(view);
      },

      create: function() {
        if (!R.authenticated()) {
          self.router.navigate('', { trigger: true });
          return;
        }

        var view = new J.Views.Create();
        self.renderContent(view);
      },

      instagram_auth: function(token) {
        window.opener.J.Utils.setInstagramAccessToken(token);
      }
    });

    this.router = new Router();
    
    this.$titleHeader = $('h1');
    this.$headerAdd = $('header .add');
    this.$headerRemove = $('header .remove');
    this.$content = $('#content');

    this.$titleHeader.click(function() {
      self.router.navigate('', { trigger: true });
    });

    this.$headerAdd.click(function() {
      if (!R.authenticated()) {
        R.authenticate({
          model: 'redirect',
          complete: function() {
            self.setHeaderButtonState('remove');
            self.router.navigate('create', { trigger: true });
          }
        });
      } else {
        self.setHeaderButtonState('remove');
        self.router.navigate('create', { trigger: true });
      }
    });

    this.$headerRemove.click(function() {
      self.setHeaderButtonState('add');
      self.router.navigate('', { trigger: true });
    });

    Backbone.history.start();
  };

  J.App.prototype.renderContent = function(view) {
    var $content = this.$content;
    $content.fadeOut('fast', function() {
      $content.html(view.render().el).fadeIn();
    });
  };

  J.App.prototype.setHeaderButtonState = function(state) {
    if (state === 'add') {
      this.$headerRemove.fadeOut();
      this.$headerAdd.fadeIn();
    } else {
      this.$headerAdd.fadeOut();
      this.$headerRemove.fadeIn();
    }
  };

  J.app = new J.App();

  window.J = J;

})();