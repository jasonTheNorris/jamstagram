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
  J.Models.Jamstagram = Backbone.Model.extend({
  });

  J.Models.JamstagramCollection = Backbone.Collection.extend({
    model: Backbone.Model,
    url: '/api/jamstagrams'
  });

  J.Models.Jamstagram = Backbone.Model.extend({
    url: '/api/p/123'
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
      'click .complete-dialog .close': 'hideCompleteDialog',
      'submit .complete-dialog form': 'onCompleteDialogFormSubmit',
      'click .complete': 'showCompleteDialog'
    },

    initialize: function() {
      this.model = new J.Models.Jamstagram();

      this.instagram = new J.Views.Instagram({
        model: new Backbone.Model(),
        el: this.$('.step.one').get(0)
      });
      this.rdio = new J.Views.Rdio({
        model: new Backbone.Collection(),
        el: this.$('.step.two').get(0)
      });

      _.bindAll(this, 'onStepComplete');

      this.instagram.on('complete', this.onStepComplete);
      this.rdio.on('complete', this.onStepComplete);
    },

    render: function() {
      J.app.setHeaderButtonState('remove');
      this.$el.html(J.Templates.create.render());
      this.$('.step.one').append(this.instagram.render().el);
      this.$('.step.two').append(this.rdio.render().el);
      return this;
    }
  });

  J.Views.View = Backbone.View.extend({
    className: 'View clearfix',

    events: {
      'click .play': 'onPlayClicked'
    },

    initialize: function() {
      _.bindAll(this);
      this.model.on('change:tracks', this.onTracksLoaded);
    },

    onPlayClicked: function(e) {
      e.preventDefault();
      R.player.queue.clear();
      _.each(this.model.get('tracks'), function(track) {
        R.player.queue.add(track.key);
      });
      R.player.queue.play();
    },

    onTracksLoaded: function() {
      _.each(this.model.get('tracks'), function(model) {
        var child = new J.Views.Track({
          playable: true,
          model: new Backbone.Model(model)
        });
        this.$('.tracks').append(child.render().el);
      }, this);
    },

    onStepComplete: function() {
      if (this.rdio.isComplete() && this.instagram.isComplete()) {
        this.$('button.complete').fadeIn();
      }
    },

    onCompleteDialogFormSubmit: function(e) {
      e.preventDefault();

      var $form = $(e.currentTarget);
      var photo = this.instagram.model;
      var tracks = this.rdio.model;

      // this.model.set({
      //   userId: photo.get('user').id + '+' + R.currentUser.get('key'),
      //   userName: R.currentUser.get('firstName') + ' ' + R.currentUser.get('lastName'),
      //   userInstagramName: photo.get('user').username,
      //   name: $form.find('[name=name]').val(),
      //   description: $form.find('[name=description]').val(),
      //   photoSrc: photo.get('images').standard_resolution.url,
      //   trackKeys: tracks.pick('key')
      // });

      // this.model.save();
      J.app.router.navigate('/p/123', { trigger: true });
    },

    getDefaultText: function() {
      var username = this.instagram.model.get('user').username;
      return 'photo by @' + username + ' — http://local.jasmstagr.am/123';
    },

    showCompleteDialog: function() {
      this.$('.complete-dialog').find('[name=description]').val(this.getDefaultText());
      J.app.hideHeaderButtons();
      this.$('button.complete').fadeOut();
      this.$('.step .number').fadeOut();
      this.$('.complete-dialog').fadeIn();
    },

    hideCompleteDialog: function() {
      J.app.showHeaderButtons();
      this.$('.complete-dialog').fadeOut();
      this.$('button.complete').fadeIn();
      this.$('.step .number').fadeIn();
    }
  });

  J.Views.View = Backbone.View.extend({
    className: 'View clearfix',

    initialize: function() {
      console.warn(this.model);
    },

    render: function() {
      J.app.setHeaderButtonState('add');
      this.$el.html(J.Templates.view.render(this.model.toJSON()));
      return this;
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
        'p/:id': 'view',
        'access_token=*token': 'instagram_auth'
      },

      view: function() {
        var model = new J.Models.Jamstagram();
        model.on('sync', function() {
          var keys = model.get('tracks');
          R.request({
            method: 'get',
            content: {
              keys: keys
            },
            success: function(response) {
              model.set('tracks', _.values(response.result));
            }
          });
          var view = new J.Views.View({
            model: model
          });
          self.renderContent(view);
        });
        model.fetch();
      },

      index: function() {
        var model = new J.Models.JamstagramCollection();
        var view = new J.Views.Index({
          model: model
        });

        model.on('sync', function() {
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
    this.$headerAbout = $('header .about');
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

    Backbone.history.start({
      pushState: true
    });
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

  J.App.prototype.hideHeaderButtons = function() {
    this.$headerRemove.fadeOut();
    this.$headerAbout.fadeOut();
  };

  J.App.prototype.showHeaderButtons = function() {
    this.$headerRemove.fadeIn();
    this.$headerAbout.fadeIn();
  };

  J.app = new J.App();

  window.J = J;

})();