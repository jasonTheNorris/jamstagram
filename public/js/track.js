(function() {
  J.Views.Track = Backbone.View.extend({
    className: 'Track',
    tagName: 'li',

    events: {
      'click': 'onClicked'
    },

    initialize: function(options) {
      if (options.selectable) {
        this.$el.addClass('selectable');
      }
    },

    onClicked: function() {
      this.trigger('selected', this.model);
    },

    render: function() {
      var templateData = this.model.toJSON();
      templateData.duration = J.Utils.formatDuration(templateData.duration);
      this.$el.html(J.Templates.track.render(templateData));
      return this;
    }
  });
})();
