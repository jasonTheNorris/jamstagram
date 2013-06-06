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

  J.Utils.instagramRequest = function(path, args, method) {
    var args = _.defaults({
      client_id: J.INSTAGRAM_CLIENT_ID
    }, args);
    var url = J.INSTAGRAM_BASE_URL + path + J.Utils.buildQueryString(args);

    return $.ajax({
      type: method || 'get',
      dataType: 'jsonp',
      url: url
    });
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
      J.app.setHeaderButtonState('add');
      this.$el.html(J.Templates.index.render({ jamstagrams: this.model.toJSON() }));
      return this;
    }
  });

  J.Views.Create = Backbone.View.extend({
    className: 'Create clearfix',

    events: {
      'keyup .instagram-search': 'onInstagramSearchKepUp',
      'click .instagram-results img': 'onInstagramResultClicked',
      'click .photo-shield': 'onPhotoShieldClicked'
    },

    render: function() {
      J.app.setHeaderButtonState('remove');
      this.$el.html(J.Templates.create.render({ songsLeftText: '5 songs left' }));
      return this;
    },

    onInstagramSearchKepUp: function(e) {
      if (e.keyCode !== 13) {
        return;
      }

      var self = this;
      var query = $(e.currentTarget).val();

      if (query.charAt(0) === '@') {
        console.error('IMPLEMENT INSTAGRAM AUTHENTICATION, DUMMY!')
        // request = J.Utils.instagramRequest('/users/search/', {
        //   q: query.slice(1)
        // });
        // request.success(function(response) {
        //   if (response.data) {
        //     var userId = response.data[0].id;
        //     path = '/users/' + userId + '/media/recent/';

        //     request = J.Utils.instagramRequest(path);
        //     request.success(function(response) {
        //       if (response.data) {
        //         console.log(response.data);
        //       }
        //     });
        //   }
        // });
      } else {
        var path = '/tags/' + query.replace(/^#/, '') + '/media/recent';
        J.Utils.instagramRequest(path).success(function(response) {
          var data = _.map(response.data, function(photo) {
            return {
              src: photo.images.thumbnail.url,
              big_src: photo.images.standard_resolution.url,
              id: photo.id
            };
          });
          var photoGrid = J.Templates.photoGrid.render({ photos: data });
          self.$('.instagram-results').html(photoGrid);
        });
      }
    },

    onInstagramResultClicked: function(e) {
      var src = $(e.currentTarget).attr('data-big-src');
      var $shield = this.$('.photo-shield');
      $shield.one('load', function() {
        $shield.fadeIn();
      });
      $shield.attr('src', src);
    },

    onPhotoShieldClicked: function(e) {
      $(e.currentTarget).fadeOut();
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
        'create': 'create'
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

      create: function(step) {
        var view = new J.Views.Create();
        self.renderContent(view);
      },
    });

    this.router = new Router();
    
    this.$headerAdd = $('header .add');
    this.$headerRemove = $('header .remove');
    this.$content = $('#content');

    this.$headerAdd.click(function() {
      self.setHeaderButtonState('remove');
      self.router.navigate('create', { trigger: true });
    });
    this.$headerRemove.click(function() {
      self.setHeaderButtonState('add');
      self.router.navigate('', { trigger: true });
    });

    Backbone.history.start();
  };

  J.App.prototype.renderContent = function(view) {
    var $content = this.$content;
    $content.fadeOut('fase', function() {
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

})();