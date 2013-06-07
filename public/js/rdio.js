(function() {
  J.Views.Rdio = Backbone.View.extend({
    className: 'Rdio empty clearfix',

    events: {
      'keyup .search': 'onSearch',
      'focus .search': 'onFocusSearch',
      'click .clear': 'onClearSearch'
    },

    maxSongCount: 5,

    initialize: function() {
      _.bindAll(this);
      this.suggestionViews = [];
      this.suggestions = new Backbone.Collection();
      this.model.on('add', this.onTrackAdded);
    },

    render: function() {
      this.$el.html(J.Templates.rdio.render());
      this.$search = this.$('.search');
      this.$tracks = this.$('.tracks');
      this.$suggestions = this.$('.suggestions');
      this.$remaining = this.$('.songs-left');
      this.updateSongText();
      return this;
    },

    updateSongText: function() {
      this.$remaining.text((this.maxSongCount - this.model.length) + ' songs to go.');
    },

    clearSearchResults: function() {
      this.suggestions.reset();
      _.each(this.suggestionViews, function(child) {
        child.remove();
      });
    },

    onSearchResults: function(response) {
      this.clearSearchResults();

      this.suggestions.reset(response.result.slice(0, 5));
      this.suggestionViews = this.suggestions.map(function(suggestion) {
        var child = new J.Views.Track({
          selectable: true,
          model: suggestion
        });
        child.on('selected', this.onSelection);
        this.$suggestions.append(child.render().el);
        return child;
      }, this);
    },

    onTrackAdded: function(track, tracks, options) {
      var child = new J.Views.Track({
        model: track
      });
      this.$tracks.append(child.render().el);
      this.$el.removeClass('empty');
      this.onClearSearch(new $.Event());
      this.updateSongText();
    },

    onSelection: function(track) {
      var attributes = track.toJSON();
      _.extend(attributes, {
        index: this.model.length + 1
      });
      this.model.add(attributes);
    },

    onFocusSearch: function() {
      this.$el.addClass('searching');
    },

    onClearSearch: function(e) {
      e.preventDefault();
      this.$search.val('');
      this.$search.blur();
      this.$el.removeClass('searching');
      this.clearSearchResults();
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
    }, 250)
  });
})();
