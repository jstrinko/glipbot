var _ = require('lodash'),
	google_images = require('google-images'),
	fast_bindall = require('fast_bindall'),
	search_client = google_images(process.env.CSE_ID, process.env.CSE_KEY);
	
var Image_Search = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	if (!this.bot) {
		throw "Handler requires bot";
	}
	this.bot.on('message', this.handle_message);
};

_.extend(Image_Search.prototype, {
	name: 'Image Roulette',
	help_text: 'Purpose: Post a random image based on a search term\nUsage: !image [search term]',
	handle_message: function(type, data) {
		if (type === this.bot.type_ids.TYPE_ID_POST && data.text && !data.deactivated) {
			var text = data.text;
			var test = text.match(/^\!image (.*?)$/i);
			if (test && test.length > 0) {
				var query = test[1];
				var self = this;
				search_client.search(query).then(function(images) {
					if (!images || images.length === 0) { return; }
					var image = images[Math.floor(Math.random() * images.length)];
					if (image && image.url) {
						self.bot.post_file_from_url(data.group_id, image.url, query + ":");
					}
				});
			}
		}
	}
});

module.exports = Image_Search;
