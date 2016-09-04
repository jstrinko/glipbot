var weather = require('weather-js'),
	_ = require('underscore'),
	fast_bindall = require('fast_bindall');

var Weather = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	if (!this.bot) {
		throw "Handler requires bot";
	}
	this.bot.on('message', this.handle_message);
};

_.extend(Weather.prototype, {
	name: 'Weather',
	help_text: 'Purpose: Look up weather\nUsage: !weather [zip code|city]',
	handle_message: function(type, data) {
		if (type === this.bot.type_ids.TYPE_ID_POST && data.text && !data.deactivated) {
			var text = data.text;
			var test = text.match(/^\!weather (.*?)$/i);
			if (test && test.length > 0) {
				var location = test[1];
				var self = this;
				weather.find({
					search: location,
					degreeType: 'F'
				}, function(error, results) {
					if (error || !results || results.length === 0) {
						return self.bot.post(data.group_id, "Unable to find weather for: " + location);
					}
					var first = results[0];
					// maybe use first.forecast at some point
					return self.bot.post(data.group_id, "Weather for: **" + first.location.name + "**\n**" + first.current.temperature + "°F**, Feels like **" + first.current.feelslike + "°F**\n" + first.current.skytext + " - Winds " + first.current.winddisplay);
				});
			}
		}
	}
});

module.exports = Weather;
