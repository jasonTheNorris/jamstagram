(function() {
  J.Views.Rdio = Backbone.View.extend({
    className: 'Rdio clearfix',

    events: {
      'keyup .search': 'onSearch'
    },

    initialize: function() {
      _.bindAll(this);
      this.children = [];
    },

    render: function() {
      this.$el.html(J.Templates.rdio.render());
      this.$search = this.$('.search');
      this.$tracks = this.$('.tracks');
      return this;
    },

    onSearchResults: function(response) {
      this.model = new Backbone.Collection(response.result);
      _.each(this.children, function(child) {
        child.remove();
      });
      this.children = this.model.map(function(model) {
        var child = new J.Views.Track({
          model: model
        });
        this.$tracks.append(child.render().el);
        return child;
      }, this);
    },

    onSearch: _.debounce(function(e) {
      var query = this.$search.val();
      if (!query) {
        return;
      }

      if (query === this._prevQuery) {
        return;
      }
      this._prevQuery = query;

      R.request({
        method: 'searchSuggestions',
        content: {
          query: query,
          types: 'Track',
          extras: ['-*', 'key', 'icon', 'name', 'duration', 'artist']
        },
        success: this.onSearchResults,
        error: function(response) {
          throw new Error(response.message);
        }
      });
    }, 500)
  });
})();
