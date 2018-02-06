'use strict';

const bitcoin = require('bitcoin');
let config = require('config');
config = config.get('lbrycrd');
const lbry = new bitcoin.Client(config);
let moderation = config.get('moderation');

exports.commands = [
  "tip"
]
exports.tip = {
  usage: "<subcommand>",
  description: 'balance: get your balance\n    deposit: get address for your deposits\n    withdraw ADDRESS AMOUNT: withdraw AMOUNT credits to ADDRESS\n    [private] <user> <amount>: mention a user with @ and then the amount to tip them, or put private before the user to tip them privately.\n Key: [] : Optionally include contained keyword, <> : Replace with appropriate value.',
  process: async function (bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content.trim().split(' ').filter(function (n) { return n !== ""; }),
      subcommand = words.length >= 2 ? words[1] : 'help';
    switch (subcommand) {
      case 'help': doHelp(msg); break;
      case 'balance': doBalance(msg, tipper); break;
      case 'deposit': doDeposit(msg, tipper); break;
      case 'withdraw': doWithdraw(msg, tipper, words); break;
      default: doTip(msg, tipper, words);
    }
  }
}

function doBalance(message, tipper) {
  lbry.getBalance(tipper, 1, function (err, balance) {
    if (err) {
      message.reply('Error getting balance.');
    }
    else {
      message.reply('You have *' + balance + '* LBC.');
    }
  });
}


function doDeposit(message, tipper) {
  if (!inPrivateOrBotSandbox(message)) {
    message.reply('Please use <'+ moderation.sandboxchannel + '> or DMs to talk to bots.');
    return;
  }
  getAddress(tipper, function (err, address) {
    if (err) {
      message.reply('Error getting your deposit address.');
    }
    else {
      message.reply('Your address is ' + address + '.');
    }
  });
}


function doWithdraw(message, tipper, words) {
  if (!inPrivateOrBotSandbox(message)) {
    message.reply('Please use <'+ moderation.sandboxchannel + '> or DMs to talk to bots.');
    return;
  }
  if (words.length < 4) {
    doHelp(message);
    return;
  }

  var address = words[2],
    amount = getValidatedAmount(words[3]);

  if (amount === null) {
    message.reply('I don\'t know how to withdraw that many credits...');
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


function doTip(message, tipper, words) {
  if (words.length < 3 || !words) {
    doHelp(message);
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
    message.reply('I don\'t know how to tip that many credits');
    return;
  }

  if (message.mentions.users.first().id) {
    sendLbc(message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv);
  }
  else {
    message.reply('Sorry, I could not find a user in your tip...');
  }
}


function doHelp(message) {
  if (!inPrivateOrBotSandbox(message)) {
    message.reply('Sent you help via DM! Please use <'+ moderation.sandboxchannel + '> or DMs to talk to bots.');
  }
  message.author.send('**!tip**\n    balance: get your balance\n    deposit: get an address for your deposits\n    withdraw ADDRESS AMOUNT: withdraw AMOUNT credits to ADDRESS\n    [private] <user> <amount>: mention a user with an @ and then the amount to tip them, or put private before the user to tip them privately.\n    Key: [] : Optionally include contained keyword, <> : Replace with appropriate value.');
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
  if ((msg.channel.type == 'dm') || (msg.channel.id === moderation.sandboxchannel)) {
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
