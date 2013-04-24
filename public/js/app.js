(function() {

  var J = {
    Templates: {},
    Utils: {},
    Models: {},
    Views: {},
    INSTAGRAM_KEY: 'a8d683aca6dd4263b5bc0bf04ba5d6ec'
  };

  // Utils
  J.Utils.getQueryString = function(args) {
    return _.map(args, function(v, k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(v);
    }).join('&');
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
    render: function() {
      J.app.setHeaderButtonState('remove');
      this.$el.html(J.Templates.create.render({ songsLeftText: '5 songs left' }));
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