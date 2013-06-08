(function() {
  J.Views.Track = Backbone.View.extend({
    className: 'Track',
    tagName: 'li',

    events: {
      'click': 'onClicked',
      'click .remove': 'onRemoveClicked',
      'dragstart': 'onDragStart',
      'drop': 'onDrop',
      'dragover': 'onDragOver',
      'dragenter': 'onDragEnter',
      'dragleave': 'onDragLeave',
      'dragend': 'onDragEnd'
    },

    onDrop: function(e) {
      e.stopPropagation();
      var from = parseInt(e.originalEvent.dataTransfer.getData('index'), 10);
      var to = this.model.get('index');
      if (isNaN(from) || isNaN(to) || from === to) {
        return;
      }
      this.trigger('drop', from, to);
    },

    onDragEnter: function(e) {
      this.$el.addClass('dragover');
    },

    onDragOver: function(e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = 'move';
      return false;
    },

    onDragLeave: function() {
      this.$el.removeClass('dragover');
    },

    onDragStart: function(e) {
      // e.originalEvent.dataTransfer.effectAllowed = 'move';
      e.originalEvent.dataTransfer.setData('index', this.model.get('index'));
      this.$el.addClass('dragging');
    },

    onDragEnd: function() {
      this.$el.removeClass('dragging');
    },

    initialize: function(options) {
      _.bindAll(this);

      if ('draggable' in this.el) {
        this.$el.attr('draggable', true);
        this.$el.addClass('draggable');
      }
      if (options.selected) {
        this.$el.addClass('selected');
      }
    },

    onRemoveClicked: function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.trigger('remove', this);
    },

    onClicked: function(e) {
      e.stopPropagation();
      this.trigger('selected', this);
    },

    render: function() {
      var templateData = this.model.toJSON();
      templateData.duration = J.Utils.formatDuration(templateData.duration);
      this.$el.html(J.Templates.track.render(templateData));
      return this;
    }
  });
})();
