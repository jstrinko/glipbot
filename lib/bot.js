var _ = require('underscore'),
	fast_bindall = require('fast_bindall'),
	fs = require('fs'),
	id_utilities = require('../lib/id_utilities'),
	type_ids = require('../lib/type_ids'),
	date_util = require('date_utilities'),
	sbot = require('sbot'),
	async = require('async'),
	socket_client = require('socket.io-client'),
	event_emitter = require('events').EventEmitter,
	https = require('https');

var Bot = function(options) {
	_.extend(this, options);
	fast_bindall(this);
	this.bot = new sbot();
	this.scoreboard_url = 'https://' + this.host + ':' + this.port;
	this.request_callbacks = {};
	this.request_count = 1;
	this.has_processed = {};
};

_.extend(Bot.prototype, event_emitter.prototype, {
	start: function() {
		async.series([
			this.get_scoreboard,
			this.init_socket,
			this.signin,
			this.get_initial_data,
			this.init_socket,
			this.connect
		], this.handle_error);
	},
	connect: function(callback) {
		console.warn("CONNECT");
		this.emit('connect');
	},
	get_scoreboard: function(callback) {
		var self = this;
		https.get(this.scoreboard_url, function(response) {
			var data = '';
			response.on('data', function(chunk) {
				data += chunk;
			});
			response.on('end', function() {
				var match = data.match(/\"scoreboard\":.*?\"(.*?):/);
				self.sexio_host = hostname = match[1];
				console.warn("SCOREBOARD:", self.sexio_host);
				return process.nextTick(callback);
			});
		});
	},
	init_socket: function(callback) {
		this.socket = socket_client.connect('https://' + this.sexio_host + ':' +  this.port, {
			extraHeaders: {
				Cookie: this.cookie
			}
		});
		console.warn('Connecting to https://' + this.sexio_host + ':' +  this.port);
		this.socket.once('connect', callback);
		this.socket.on('event', this.handle_event);
		this.socket.on('message', this.handle_message);
		this.socket.on('response', this.handle_response);
		this.socket.on('disconnect', this.handle_disconnect);
		this.socket.on('error', this.handle_error);
	},
	handle_error: function(error) {
		if (error) {
			console.warn("ERROR:", error);
		}
	},
	signin: function(callback) {
		console.warn("SIGNING IN");
		var self = this;
		this.request(
			'/api/login', 
			'PUT',
			{
				email: this.user,
				password: this.password,
				rememberme: true,
				_csrf: null
			},
			function(error, data) {
				if (error) { return callback(data); }
				console.warn(data);
				self.auth = data['X-Authorization'];
				self.cookie = data.set_cookie.map(function(cookie) {
					var parts = cookie.split(/\;/);
					return parts[0];
				}).join("; ");
				console.warn(self.cookie);
				return process.nextTick(callback);
			}
		);
	},
	request: function(uri, method, params, callback) {
		params.request_id = this.request_count;
		this.request_callbacks[this.request_count] = callback;
		this.request_count++;
		this.socket.emit(
			'request', 
			{ 
				uri: uri, 
				parameters: params,
				method: method
			}
		);
	},
	handle_response: function(data) {
		if (
			data && 
			data.request && 
			data.request.parameters &&	
			data.request.parameters.request_id 
		) {
			var request_id = data.request.parameters.request_id;
			if (this.request_callbacks[request_id]) {
				return this.request_callbacks[request_id](null, data);
			}			
		}
	},
	handle_event: function(event) {
		console.warn("SOCKET EVENT:", event);
	},
	handle_message: function(message_raw) {
		var message;
		try {
			message = JSON.parse(message_raw);
		} catch(error) {
			console.warn(error);
		}
		if (!message.body || !message.body.objects) { return; }
		async.forEach(message.body.objects, this.process_object_group, this.handle_error);
	},
	process_object_group: function(object_group, callback) {
		async.forEach(object_group, this.process_object, callback);
	},
	process_object: function(object, callback) {
		var id = object._id;
		var type = id_utilities.prototype.extract_type(id);
		this.emit('message', type, object);
		console.warn("INCOMING:", object);
		return process.nextTick(callback);
	},
	post: function(group_id, text) {
		this.request(
			'/api/post',
			'POST',
			{
				created_at: +new Date(),
				creator_id: this.user_id,
				is_new: true,
				item_ids: [],
				group_id: group_id,
				text: text
			},
			function(error, data) {
				console.warn(error, data);
			}
		);
	},
	handle_disconnect: function(reason) {
	},
	get_initial_data: function(callback) {
		var self = this;
		this.request(
			'/api/index',
			'GET',
			{},
			function(error, pack) {
				var data = pack.body;
				self.user_id = data.user_id;
				var parts = data.scoreboard.split(/\:/);
				self.sexio_host = parts[0];
				self.port = parts[1];
				self.initial_data = data;
				self.socket.close();
				return process.nextTick(callback);
			}
		);
	}
});

module.exports = Bot;
