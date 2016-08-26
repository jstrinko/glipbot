var _ = require('underscore'),
	sbot = require('sbot'),
	fast_bindall = require('fast_bindall');

var Stocks = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	if (!this.bot) { 
		throw "Handler requires bot";
	}
	this.bot.on('message', this.handle_message);
	this.sbot = new sbot();
};

_.extend(Stocks.prototype, {
	handle_message: function(type, data) {
		if (type === this.bot.type_ids.TYPE_ID_POST) {
			var text = data.text;
			var test = data.text.match(/^\!stock (.*?)$/i);
			if (test && test.length > 0) {
				var symbol = test[1];
				var self = this;
				var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22" + encodeURIComponent(symbol) + "%22)%0A%09%09&env=http%3A%2F%2Fdatatables.org%2Falltables.env&format=json";
				var self = this;
				this.sbot.fetch_object(url, {}, function(error, result) {
					if (error || !result || !result.query || !result.query.count > 0) {
						return self.bot.post(data.group_id, "Unable to find symbol: " + symbol);
					}
					var groups = result.query.results.quote.map(function(quote) {
						return "**" + quote.symbol.toUpperCase() + '** - ' + quote.Name + "\n**" + quote.Bid + " " + quote.Currency + "** - " + quote.Change_PercentChange;
					});
					return self.bot.post(data.group_id, groups.join("\n\n"));
				});
			}
		}
	}
});

module.exports = Stocks;
