(function() {

  var J = {
    Models: {},
    Views: {},
    Utils: {}
  };

  // Models
  J.Models.JamstagramCollections = Backbone.Collection.extend({
    model: Backbone.Model,
    url: '/api/jamstagrams'
  });

  // Views
  J.Views.Index = Backbone.View.extend({
    className: 'Index clearfix',
    render: function() {
      J.app.setHeaderButtonState('add');
      this.$el.html(ich.index({ jamstagrams: this.model.toJSON() }));
      return this;
    }
  });

  J.Views.Create = Backbone.View.extend({
    className: 'Create clearfix',
    render: function() {
      J.app.setHeaderButtonState('remove');
      this.$el.html(ich.create({ songsLeftText: '5 songs left' }));
      return this;
    } 
  });

  // App
  J.App = function() {
    var self = this;

    $.getJSON('/api/templates', function(data) {
      _.each(data, function(template, name) {
        ich.addTemplate(name, template);
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
        var model = new J.Models.JamstagramCollections();
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