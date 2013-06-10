(function() {
  J.Views.Instagram = Backbone.View.extend({
    className: 'Instagram clearfix',

    events: {
      'keyup .search': 'onSearchKepUp',
      'click .results img': 'onResultClicked',
      'click .photo-shield .nav': 'onPhotoShieldNavClicked',
      'click .photo-shield .select': 'onPhotoShieldSelectClicked',
      'click .photo-shield .remove': 'onPhotoShieldRemoveClicked'
    },

    initialize: function() {
      this.photos = new Backbone.Collection();
      this.photos.on('reset', this.onPhotosReset, this);
    },

    render: function() {
      this.$el.html(J.Templates.instagram.render());
      return this;
    },

    onSearchKepUp: function(e) {
      if (e.keyCode !== 13) {
        return;
      }

      var self = this;
      var query = $(e.currentTarget).val();

      if (query.charAt(0) === '@') {
        J.Utils.authInstagram().done(function() {
          J.Utils.instagramRequest('/users/search/', {
            q: query.slice(1)
          }).done(function(response) {
            var userId = response.data[0].id;
            var path = '/users/' + userId + '/media/recent/';
            
            J.Utils.instagramRequest(path).done(function(response) {
              self.photos.reset(response.data);
            });
          });
        });
      } else {
        var path = '/tags/' + query.replace(/^#/, '') + '/media/recent';
        J.Utils.instagramRequest(path).done(function(response) {
          self.photos.reset(response.data);
        });
      }
    },

    onPhotosReset: function(data) {
      var data = this.photos.map(function(photo, index) {
        return {
          src: photo.get('images').thumbnail.url,
          index: index
        };
      });
      var photoGrid = J.Templates.photoGrid.render({ photos: data });
      this.$('.results').html(photoGrid);
    },

    onResultClicked: function(e) {
      this.currentPhotoIndex = $(e.currentTarget).attr('data-index');
      var $shield = this.$('.photo-shield');
      var $shieldImage = $shield.find('img');
      
      $shieldImage.one('load', function() {
        $shield.fadeIn();
      });
      
      this.loadShieldPhoto();
    },

    onPhotoShieldNavClicked: function(e) {
      if ($(e.currentTarget).is('.next')) {
        if (this.currentPhotoIndex !== this.photos.length - 1) {
          this.currentPhotoIndex++;
        }
      } else if (this.currentPhotoIndex !== 0) {
        this.currentPhotoIndex--;
      }
      this.loadShieldPhoto();
    },

    loadShieldPhoto: function() {
      var src = this.photos.at(this.currentPhotoIndex).get('images').standard_resolution.url;
      this.$('.photo-shield img').attr('src', src);
    },

    onPhotoShieldSelectClicked: function() {
      this.$('.photo-shield .controls').fadeOut();
      this.$('.number').addClass('complete');
      this._complete = true;
      this.trigger('complete');
    },

    onPhotoShieldRemoveClicked: function() {
      if (this._complete) {
        this._complete = false;
        this.$('.number').removeClass('complete');
        this.$('.photo-shield .controls').fadeIn();
      } else {
        this.$('.photo-shield').fadeOut();
      }
    },

    isComplete: function() {
      return this._complete;
    }
  });
})();