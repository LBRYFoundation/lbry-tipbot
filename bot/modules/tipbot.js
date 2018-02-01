'use strict';

const bitcoin = require('bitcoin');
let config = require('config');
config = config.get('lbrycrd');
const lbry = new bitcoin.Client(config);

exports.commands = [
  "tip"
]
exports.tip = {
  usage: "<subcommand>",
  description: '\t[help]\n\t\tGet this message\n\tbalance\n\t\tGet your balance\n\tdeposit\n\t\tGet address for your deposits\n\twithdraw ADDRESS AMOUNT\n\t\tWithdraw AMOUNT credits to ADDRESS\n\t[private] <user> <amount>\n\t\tMention a user with @ and then the amount to tip them, or put private before the user to tip them privately.\nKey: [] : Optionally include contained keyword, <> : Replace with appropriate value.',
  process: async function (bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content.trim().split(' ').filter(function (n) { return n !== ""; }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      helpmsgparts = [['[help]', 'Get this message'],
                      ['balance', 'Get your balance'],
                      ['deposit', 'Get address for your deposits'],
                      ['withdraw ADDRESS AMOUNT', 'Withdraw AMOUNT credits to ADDRESS'],
                      ['[private] <user> <amount>', 'Mention a user with @ and then the amount to tip them, or put private before the user to tip them privately.']],
      helpmsg = '```**!tip**\n' + formatDescriptions(helpmsgparts) + 'Key: [] : Optionally include contained keyword, <> : Replace with appropriate value.```',
      channelwarning = 'Please use <#369896313082478594> or DMs to talk to bots.';
    switch (subcommand) {
      case 'help': privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]); break;
      case 'balance': doBalance(msg, tipper); break;
      case 'deposit': privateOrSandboxOnly(msg, channelwarning, doDeposit, [tipper]); break;
      case 'withdraw': privateOrSandboxOnly(msg, channelwarning, doWithdraw, [tipper, words, helpmsg]); break;
      default: doTip(msg, tipper, words, helpmsg);
    }
  }
}

function privateOrSandboxOnly(message, wrongchannelmsg, fn, args) {
  if (!inPrivateOrBotSandbox(message)) {
    message.reply(wrongchannelmsg);
    return;
  }
  fn.apply(null, [message, ...args]);
}


function doHelp(message, helpmsg) {
  message.author.send(helpmsg);
}


function doBalance(message, tipper) {
  lbry.getBalance(tipper, 1, function (err, balance) {
    if (err) {
      message.reply('Error getting balance');
    }
    else {
      message.reply('You have *' + balance + '* LBC');
    }
  });
}


function doDeposit(message, tipper) {
  getAddress(tipper, function (err, address) {
    if (err) {
      message.reply('Error getting deposit address');
    }
    else {
      message.reply('Your address is ' + address);
    }
  });
}


function doWithdraw(message, tipper, words, helpmsg) {
  if (words.length < 4) {
    doHelp(message, helpmsg);
    return;
  }

  var address = words[2],
      amount = getValidatedAmount(words[3]);

  if (amount === null) {
    message.reply('I dont know how to withdraw that many credits');
    return;
  }

  lbry.sendFrom(tipper, address, amount, function (err, txId) {
    if (err) {
      message.reply(err.message);
    }
    else {
      message.reply('You withdrew ' + amount + ' to ' + address + ' (' + txLink(txId) + ')');
    }
  });
}


function doTip(message, tipper, words, helpmsg) {
  if (words.length < 3 || !words) {
    doHelp(message, helpmsg);
    return;
  }

  let prv = 0;
  let amountOffset = 2;
  if (words.length >= 4 && words[1] === 'private') {
    prv = 1;
    amountOffset = 3;
  }

  let amount = getValidatedAmount(words[amountOffset]);

  if (amount === null) {
    message.reply('I dont know how to tip that many credits');
    return;
  }

  if (message.mentions.users.first().id) {
    sendLbc(message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv);
  }
  else {
    message.reply('Sorry, I could not find a user in your tip...');
  }
}


function sendLbc(message, tipper, recipient, amount, privacyFlag) {
  getAddress(recipient, function (err, address) {
    if (err) {
      message.reply(err.message);
    }
    else {
      lbry.sendFrom(tipper, address, amount, 1, null, null, function (err, txId) {
        if (err) {
          message.reply(err.message);
        }
        else {
          var imessage =
            'Wubba lubba dub dub! <@' + tipper + '> tipped <@' + recipient + '> ' + amount + ' LBC (' + txLink(txId) + '). ' +
            'DM me `!tip` for tipbot instructions.'
          if (privacyFlag) {
            message.author.send(imessage);
            if (message.author.id != message.mentions.users.first().id) {
              message.mentions.users.first().send(imessage);
            }
          } else {
            message.reply(imessage);
          }
        }
      });
    }
  });
};


function getAddress(userId, cb) {
  lbry.getAddressesByAccount(userId, function (err, addresses) {
    if (err) {
      cb(err);
    }
    else if (addresses.length > 0) {
      cb(null, addresses[0]);
    }
    else {
      lbry.getNewAddress(userId, function (err, address) {
        if (err) {
          cb(err);
        }
        else {
          cb(null, address);
        }
      });
    }
  });
}


function inPrivateOrBotSandbox(msg) {
  if ((msg.channel.type == 'dm') || (msg.channel.id === '369896313082478594')) {
    return true;
  } else {
    return false;
  }
}


function getValidatedAmount(amount) {
  amount = amount.trim();
  if (amount.toLowerCase().endsWith('lbc')) {
    amount = amount.substring(0, amount.length - 3);
  }
  return amount.match(/^[0-9]+(\.[0-9]+)?$/) ? amount : null;
}


function txLink(txId) {
  return "<https://explorer.lbry.io/tx/" + txId + ">";
}


function formatDescriptions(msgparts) {
  return msgparts.map(elem => '\t' + elem[0] + '\n\t\t' + elem[1] + '\n')
                 .join('');
}
