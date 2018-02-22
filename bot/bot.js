'use strict';

// Load up libraries
const Discord = require('discord.js');
// Load config!
let config = require('config');
let botConfig = config.get('bot');
let commands = {};

const bot = new Discord.Client();

bot.on('ready', function() {
  console.log(`Logged in! Serving in ${bot.guilds.array().length} servers`);
  require('./plugins.js').init();
  console.log(`type ${botConfig.prefix}help in Discord for a commands list.`);
  bot.user.setActivity(botConfig.prefix + 'tip');
});

bot.on('disconnected', function() {
  console.log('Disconnected!');
  process.exit(1); //exit node.js with an error
});

function checkMessageForCommand(msg) {
  //check if message is a command
  if (msg.author.id !== bot.user.id && msg.content.startsWith(botConfig.prefix)) {
    console.log(`treating ${msg.content} from ${msg.author} as command`);
    let cmdTxt = msg.content.split(' ')[0].substring(botConfig.prefix.length);
    let suffix = msg.content.substring(cmdTxt.length + botConfig.prefix.length + 1); //add one for the ! and one for the space
    if (msg.isMentioned(bot.user)) {
      try {
        cmdTxt = msg.content.split(' ')[1];
        suffix = msg.content.substring(bot.user.mention().length + cmdTxt.length + botConfig.prefix.length + 1);
      } catch (e) {
        //no command
        return msg.channel.send('Yes?');
      }
    }
    let cmd = commands[cmdTxt];
    if (cmd) {
      // Add permission check here later on ;)
      try {
        cmd.process(bot, msg, suffix);
      } catch (e) {
        let msgTxt = `command ${cmdTxt} failed :(`;
        if (botConfig.debug) {
          msgTxt += '\n' + e.stack;
        }
        msg.channel.send(msgTxt);
      }
    }
  } else {
    //message isn't a command or is from us
    //drop our own messages to prevent feedback loops
    if (msg.author === bot.user) {
      return;
    }

    if (msg.author !== bot.user && msg.isMentioned(bot.user)) {
      msg.channel.send('yes?'); //using a mention here can lead to looping
    }
  }
}

bot.on('message', msg => checkMessageForCommand(msg));

exports.addCommand = function(commandName, commandObject) {
  try {
    commands[commandName] = commandObject;
  } catch (err) {
    console.log(err);
  }
};
exports.addCustomFunc = function(customFunc) {
  try {
    customFunc(bot);
  } catch (err) {
    console.log(err);
  }
};
exports.commandCount = function() {
  return Object.keys(commands).length;
};

bot.login(botConfig.token);
