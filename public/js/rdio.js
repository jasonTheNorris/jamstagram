(function() {
  J.Views.Rdio = Backbone.View.extend({
    className: 'Rdio empty clearfix',

    events: {
      'keyup .search': 'onSearch',
      'focus .search': 'onFocusSearch',
      'click .clear': 'onClearSearch'
    },

    maxSongCount: 5,

    _complete: false,

    initialize: function() {
      _.bindAll(this);
      this.suggestionViews = [];
      this.suggestions = new Backbone.Collection();
      this.model.on('add', this.onTrackAdded);
      this.model.on('change:index', this.onTrackReorder);

      console.log(this.model);
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
      var count = this.maxSongCount - this.model.length;
      var songText = count === 1 ? 'song' : 'songs';
      this.$remaining.text(count + ' ' + songText + ' to go.');
    },

    /* R.player.play({
      source: "a171827"
    }); */

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
          model: suggestion
        });
        child.on('selected', this.onTrackSelected);
        this.$suggestions.append(child.render().el);
        return child;
      }, this);
    },

    onTrackAdded: function(track, tracks, options) {
      var child = new J.Views.Track({
        selected: true,
        model: track
      });
      child.on('remove', this.onTrackRemoved);
      child.on('drop', this.onTrackDropped);
      this.$tracks.append(child.render().el);
      this.$el.removeClass('empty');
      this.onClearSearch(new $.Event());
      this.updateSongText();
    },

    onTrackDropped: function(from, to) {
      var fromModel = this.model.findWhere({ index: from });
      var toModel = this.model.findWhere({ index: to });
      if (fromModel && toModel) {
        fromModel.set('index', to, { silent: true });
        toModel.set('index', from);
      }
    },

    onTrackReorder: function(model, value, options) {
      var from = model.get('index');
      var to = model.previous('index');
      var $tracks = this.$tracks.children('li');
      var $track = $tracks.eq(from - 1);
      var $next = $tracks.eq(to - 1);
      if (from > to) {
        $track.insertBefore($next);
      } else {
        $track.insertAfter($next);
      }
    },

    onTrackRemoved: function(track) {
      this.model.remove(track.model);
      track.remove();

      if (!this.model.length) {
        this.$el.addClass('empty');
      }

      if (this.model.length < this.maxSongCount) {
        this.$('h2.complete').hide();
        this.$('h2.incomplete').show();
        this.$('.number').removeClass('complete');
        this.$search.fadeIn();
        this._complete = false;
      }

      this.updateSongText();
    },

    onFinished: function() {
      this.$search.hide();
      this.$('.number').addClass('complete');
      this.$('h2.incomplete').hide();
      this.$('h2.complete').show();
      this._complete = true;
      this.trigger('complete');
    },

    isComplete: function() {
      return this._complete;
    },

    onTrackSelected: function(track) {
      if (this.model.length < this.maxSongCount) {
        var attributes = track.model.toJSON();
        _.extend(attributes, {
          index: this.model.length + 1
        });
        this.model.add(attributes);

        if (this.model.length === this.maxSongCount) {
          this.onFinished();
        }
      }
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
