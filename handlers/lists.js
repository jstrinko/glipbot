var _ = require('underscore'),
	sbot = require('sbot'),
	fs = require('fs'),
	commander = require('commander'),
	fast_bindall = require('fast_bindall');

var Lists = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	if (!this.bot) { 
		throw "Handler requires bot";
	}
	if (!this.path) {
		throw "Handler requires a path to store its files";
	}
	var files = fs.readdirSync(this.path);
	var self = this;
	this.lists = {};
	_.each(files, function(file) {
		if (file.match(/^\w+$/)) {
			self.lists[file] = fs.readFileSync(self.path + file, 'utf8').trim().split(/\n/);
		}
	});
	this.bot.on('message', this.handle_message);
	this.sbot = new sbot();
};

_.extend(Lists.prototype, {
	handle_message: function(type, data) {
		if (type === this.bot.type_ids.TYPE_ID_POST) {
			var text = data.text;
			var test = data.text.match(/^\!list (.*?)$/i);
			if (test && test.length > 0) {
				var args = test[1];
				var parts = args.split(/\s/);
				var listname = parts.shift();
				if (!listname.match(/^\w+$/)) {
					return this.invalid_listname(data, listname);
				}
				if (listname.match(/^showall|ls|list$/)) {
					return this.show_all_lists(data);
				}
				if (listname === 'help') {
					return this.show_help(data);
				}
				if (!parts.length) {
					return this.dump_list(data, listname);
				}
				var command = parts.shift();
				if (command == 'add') {
					return this.add(data, listname, parts.join(" "));
				}
				if (command == 'remove') {
					if (parts.length) {
						return this.remove(data, listname, parts);
					}
				}
				if (command == 'delete') {
					return this.delete_list(data, listname);
				}
				if (command == 'random') {
					return this.post_random(data, listname);
				}
				if (command.match(/^\d+$/)) {
					return this.post_line(data, listname, command);
				}
				return this.unrecognized_request(data, listname);
			}
		}
	},
	show_all_lists: function(data) {
		return this.bot.post(data.group_id, "Available Lists:[code]" + Object.keys(this.lists).join("\n"));
	},
	dump_list: function(data, listname) {
		if (!this.lists[listname]) {
			return this.invalid_listname(data, listname);
		}
		var count = 0;
		return this.bot.post(data.group_id, "Contents of " + listname + ":[code]" + this.lists[listname].map(function(line) { count++; return count + ") " + line; }).join("\n"));
	},
	add: function(data, listname, new_line) {
		if (!this.lists[listname]) {
			this.lists[listname] = [];
		}
		this.lists[listname].push(new_line);
		var contents = this.lists[listname].join("\n");
		fs.writeFileSync(this.path + listname, contents);
		return this.bot.post(data.group_id, "New item added to list: " + this.lists[listname].length + ") " + new_line);		
	},
	remove: function(data, listname, line) {
		if (!this.lists[listname]) {
			return this.invalid_listname(data, listname);
		}
		line = parseInt(line, 10) - 1;
		if (!this.lists[listname][line]) {
			return this.bot.post(data.group_id, (line + 1) + " is out of range for list: " + listname);
		}
		var removed = this.lists[listname].splice(line, 1);
		var contents = this.lists[listname].join("\n");
		fs.writeFileSync(this.path + listname, contents);
		return this.bot.post(data.group_id, "Item removed from list: " + removed[0]);		
	},
	post_random: function(data, listname) {
		if (!this.lists[listname]) {
			return this.invalid_listname(data, listname);
		}
		this.post_line(data, listname, Math.floor(Math.random() * this.lists[listname].length) + 1);
	},
	post_line: function(data, listname, line) {
		if (!this.lists[listname]) {
			return this.invalid_listname(data, listname);
		}
		line = parseInt(line, 10) - 1;
		if (!this.lists[listname][line]) {
			return this.bot.post(data.group_id, (line + 1) + " is out of range for list: " + listname);
		}
		return this.bot.post(data.group_id, (line + 1) + ") " + this.lists[listname][line]);
	},
	unrecognized_request: function(data, listname) {
		this.bot.post(data.group_id, "This does not appear to be a valid requeest - see !list help");
	},
	show_help: function(data) {
		this.bot.post(
			data.group_id, 
			"Usage: [code]" + 
			"!list help - show this help" + 
			"\n!list ls|showall|list - display all lists" + 
			"\n!list [listname] - dump entire list" + 
			"\n!list [listname] [number] - show item from list" + 
			"\n!list [listname] random - show random item from list" +
			"\n!list [listname] add [data] - add item to list" + 
			"\n!list [listname] remove [number] - remove item from list" + 
			"\n!list [listname] delete - delete the list USE WITH CAUTION"
		);
	},
	delete_list: function(data, listname) {
		if (!this.lists[listname]) {
			return this.invalid_listname(data, listname);
		}
		delete this.lists[listname];
		fs.unlinkSync(this.path + listname);
		this.bot.post(data.group_id, "The following list has been deleted: " + listname);
	},
	invalid_listname: function(data, listname) {
		return this.bot.post(data.group_id, "List not found; " + listname);
	}
});

module.exports = Lists;
