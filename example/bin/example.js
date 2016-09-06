var program = require('commander'), 
	Bot = require('../../lib/bot'),
	Stocks = require('../../handlers/stocks'),
	Beer = require('../../handlers/beer'),
	Lists = require('../../handlers/lists'),
	Image_Search = require('../../handlers/image-search'),
	Help = require('../../handlers/help'),
	Reminder = require('../../handlers/event_reminder'),
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
bot.use(Stocks);
bot.use(Beer);
bot.use(Lists, { path: process.env.HOME + '/lists/' });
bot.use(Help);
bot.use(Reminder);
bot.use(Image_Search);
bot.start();
