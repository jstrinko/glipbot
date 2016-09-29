var translator = require('yandex-translate')(process.env.YANDEX_API_KEY),
	_ = require('underscore'),
	fast_bindall = require('fast_bindall');

var Translator = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	if (!this.bot) {
		throw "Handler requires bot";
	}
	this.bot.on('message', this.handle_message);
};

_.extend(Translator.prototype, {
	name: 'Translator',
	help_text: 'Purpose: Translate text\nUsage: !translate [language key (https://tech.yandex.com/translate/doc/dg/concepts/api-overview-docpage/) | desired message]',
	handle_message: function(type, data) {
		if (type === this.bot.type_ids.TYPE_ID_POST && data.text && !data.deactivated) {
			var text = data.text;
			var test = text.match(/^\!translate ([a-z]+)/i);
			if (test && test.length > 0) {
				var language_key = test[1];
				var translate_text = text.split('|')[1];
				var self = this;
				if (!translate_text) {
					return self.bot.post(data.group_id, "Unable to translate: Missing desired message");
				}
				translator.translate(translate_text, { to: language_key }, function(error, response) {
					if (error || !response || response.length === 0) {
						return self.bot.post(data.group_id, "Unable to translate: " + data.text);
					}
					return self.bot.post(data.group_id, response.text + "\n*Powered by Yandex.Translate*");
				});

			}
		}
	}
});

module.exports = Translator;
