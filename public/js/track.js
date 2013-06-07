(function() {
  J.Views.Track = Backbone.View.extend({
    className: 'Track',
    tagName: 'li',
    render: function() {
      this.$el.html(J.Templates.track.render(this.model.toJSON()));
      return this;
    }
  });
})();
