var	_ = require('underscore'),
	async = require('async'),
	fast_bindall = require('fast_bindall');

var Reminder = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	if (!this.bot) { 
		throw "Handler requires bot";
	}
	this.bot.on('message', this.handle_message);
	this.bot.on('connect', this.fetch_events);
};

_.extend(Reminder.prototype, {
	name: 'Reminder',
	help_text: 'Purpose: Remind groups of scheduled events\nUsage: Passive',
	handle_message: function(type, data) {
		if (type === this.bot.type_ids.TYPE_ID_EVENT) {
			this.set_reminder(data);
		}
	},
	fetch_events: function() {
    var self = this;
    this.bot.request(
      '/api/items',
      'GET',
      { type_id: 14 },
      function(error, pack) {
        if (error) { return console.warn("ERROR FETCHING EVENTS:", error); }
        if (pack && pack.body && pack.body.length) {
          async.forEach(pack.body, self.set_reminder, function(error) {
						if (error) { console.warn("ERROR SETTING REMINDER:", error); }
					});
        }
      }
    );
	},
  set_reminder: function(event, callback) {
    var now = +new Date();
    var self = this;
    if (event && event.start && event.start > now) {
      console.warn("SETTING REMINDER FOR:", event.text, event.start - now)
      setTimeout(function() {
        self.remind(event);
      }, event.start - now);
    }
    if (callback) {
      return process.nextTick(callback);
    }
  },
  remind: function(event) {
    var self = this;
    async.forEach(event.group_ids, function(group_id, cb) {
      self.bot.post(group_id, event.text + " is about to start");
      return process.nextTick(cb);
    }, function(error) {
      if (error) { console.warn(error); }
    });
  },
});

module.exports = Reminder;
