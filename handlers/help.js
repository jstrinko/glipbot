var _ = require('underscore'),
	fast_bindall = require('fast_bindall');

var Help = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	if (!this.bot) { 
		throw "Handler requires bot";
	}
	this.bot.on('message', this.handle_message);
};

_.extend(Help.prototype, {
	name: 'Help',
	help_text: 'Purpose: Display Help\nUsage: !help',
	handle_message: function(type, data) {
		if (type === this.bot.type_ids.TYPE_ID_POST && data.text) {
			var text = data.text;
			var test = text.match(/^\!help.*$/i);
			if (test && test.length > 0) {
				var lines = this.bot.handlers.map(function(handler) {
					return "**" + handler.name + "**[code]" + handler.help_text + "[/code]"; 
				});
				this.bot.post(data.group_id, lines.join(""));
			}
		}
	}
});

module.exports = Help;
