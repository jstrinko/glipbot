var _ = require('underscore'),
	sbot = require('sbot'),
	fast_bindall = require('fast_bindall');

var Beer = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	if (!this.bot) {
		throw "Handler requires bot";
	}
	this.bot.on('message', this.handle_message);
	this.sbot = new sbot();
};

_.extend(Beer.prototype, {
	name: 'Beer Lookup',
	help_text: 'Purpose: Learn about beer\nUsage: !beer [name of a beer]',
	handle_message: function(type, data) {
		if (type === this.bot.type_ids.TYPE_ID_POST && data.text && !data.deactivated) {
			var text = data.text;
			var test = text.match(/^\!beer (.*?)$/i);
			if (test && test.length > 0) {
				var beer = test[1];
				var self = this;
				this.sbot.fetch_text('http://haxit.org/twilio/batext.php?output=text&Body=' + beer, {}, function(error, text) {
					if (text && !error) {
						self.bot.post(data.group_id, text.replace(/\|/g, '-'));
					}
				});
			}
		}
	}
});

module.exports = Beer;
