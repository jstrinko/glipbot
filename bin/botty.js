var program = require('commander'), 
	Bot = require(process.env.SRCTOP + '/botty/lib/bot'),
	async = require('async');

// botty@glip.com/Botty888

program
	.option('-e, --env <env>', 'Environment', String, 'qa')
	.option('-u, --user <user>', 'User')
	.option('-p, --password <password>', 'Password')
	.parse(process.argv);

var hosts = {
	dev: 'd1.glip.net',
	qa: 'glipqa.com',
	prod: 'glip.com'
};

var ports = {
	dev: 10150,
	qa: 443,
	prod: 443
};

var bot = new Bot({
	host: hosts[program.env],
	port: ports[program.env],
	user: program.user,
	password: program.password
});
bot.start();
