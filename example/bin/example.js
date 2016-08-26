var program = require('commander'), 
	Bot = require('../../lib/bot'),
	Weather = require('../../handlers/weather');

// botty@glip.com/Botty888

program
	.option('-u, --user <user>', 'User')
	.option('-p, --password <password>', 'Password')
	.parse(process.argv);

var bot = new Bot({
	host: 'glip.com',
	port: 443,
	user: program.user,
	password: program.password
});
bot.use(Weather);
bot.start();
