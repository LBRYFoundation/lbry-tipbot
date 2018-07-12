'use strict';

const bitcoin = require('bitcoin');
let config = require('config');
let spamchannel = config.get('sandboxchannel');
let regex = require('regex');
let lbrycrdConfig = config.get('lbrycrd');
const lbry = new bitcoin.Client(lbrycrdConfig);

exports.commands = ['tip', 'multitip', 'roletip', 'tips'];
exports.tip = {
  usage: '<subcommand>',
  description: 'Tip a given user with an amount of LBC or perform wallet specific operations.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      helpmsgparts = [],
      helpmsg = {
        embed: {
          description: "
          __**TIPS**__\n\n
          **Balance**: `!tip balance`\n
          **Deposit Address**: `!tip deposit`\n
          **Withdraw**:, `!tip withdraw <AMOUNT> <ADDRESS>`\n
          **Private Tip**: `!privatetip <user> <amount>`\n\n
          __**ROLE TIPS**__ Use this to tip everyone in a role.\n\n
          **Role Tip**: `!roletip <role> <amount>`\n
          **Private Role Tip**: `!privatetip <role> <amount>`\n\n
          __**MULTI TIPS**__ Use this to tip multiple people at once\n\n
          **Multi Tip**: `!multitip <user> <user> <amount>`\n
          **Private Multi Tip** `!multitip private <user> <user> <amount>`\n
          **Note**: Multi tips can contain any amount of users to tip.\n\n
          __**FURTHER INFORMATION**__\n\n
          **Help**: `!tip help` *Get this message.\n
          Read our [Tipbot FAQ](https://lbry.io/faq/tipbot-discord) for a more details
        ",
          color: 1109218,
          author: { name: '!tip' }
        }
      },
      channelwarning = 'Please use <#' + spamchannel + '> or DMs to talk to bots.',
      MultiorRole = false;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      case 'balance':
        doBalance(msg, tipper);
        break;
      case 'deposit':
        privateOrSandboxOnly(msg, channelwarning, doDeposit, [tipper]);
        break;
      case 'withdraw':
        privateOrSandboxOnly(msg, channelwarning, doWithdraw, [tipper, words, helpmsg]);
        break;
      default:
        doTip(bot, msg, tipper, words, helpmsg, MultiorRole);
    }
  }
};

exports.multitip = {
  usage: '<subcommand>',
  description: 'Tip multiple users simultaneously for the same amount of LBC each.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      helpmsgparts = [],
      helpmsg = {},
      channelwarning = 'Please use <#' + spamchannel + '> or DMs to talk to bots.',
      MultiorRole = true;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      default:
        doMultiTip(bot, msg, tipper, words, helpmsg, MultiorRole);
        break;
    }
  }
};

exports.roletip = {
  usage: '<subcommand>',
  description: 'Tip every user in a given role the same amount of LBC.',
  process: async function(bot, msg, suffix) {
    let tipper = msg.author.id.replace('!', ''),
      words = msg.content
        .trim()
        .split(' ')
        .filter(function(n) {
          return n !== '';
        }),
      subcommand = words.length >= 2 ? words[1] : 'help',
      helpmsgparts = []
      ],
      helpmsg = {},
      channelwarning = `Please use <#${spamchannel}> or DMs to talk to bots.`,
      MultiorRole = true;
    switch (subcommand) {
      case 'help':
        privateOrSandboxOnly(msg, channelwarning, doHelp, [helpmsg]);
        break;
      default:
        doRoleTip(bot, msg, tipper, words, helpmsg, MultiorRole);
        break;
    }
  }
};

exports.tips = {
  usage: '',
  description: 'Lists all available tipbot commands with brief descriptions for each one.',
  process: async function(bot, msg, suffix) {
    let helpmsgparts = [],
      helpmsg = {}
      };
    msg.reply(helpmsg);
  }
};

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
  lbry.getBalance(tipper, 1, function(err, balance) {
    if (err) {
      message.reply('Error getting balance.').then(message => message.delete(5000));
    } else {
      message.reply(`You have *${balance}* LBC`);
    }
  });
}

function doDeposit(message, tipper) {
  getAddress(tipper, function(err, address) {
    if (err) {
      message.reply('Error getting your deposit address.').then(message => message.delete(5000));
    } else {
      message.reply(`Your address is ${address}`);
    }
  });
}

function doWithdraw(message, tipper, words, helpmsg) {
  if (words.length < 4) {
    return doHelp(message, helpmsg);
  }

  let address = words[2],
    amount = getValidatedAmount(words[3]);

  if (amount === null) {
    message.reply("I don't know how to withdraw that many credits...").then(message => message.delete(5000));
    return;
  }

  lbry.sendFrom(tipper, address, amount, function(err, txId) {
    if (err) {
      return message.reply(err.message).then(message => message.delete(5000));
    }
    message.reply(`You withdrew ${amount} LBC to ${address}.
${txLink(txId)}`);
  });
}

function doTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (words.length < 3 || !words) {
    return doHelp(message, helpmsg);
  }

  let prv = false;
  let amountOffset = 2;
  if (words.length >= 4 && words[1] === 'private') {
    prv = true;
    amountOffset = 3;
  }

  let amount = getValidatedAmount(words[amountOffset]);

  if (amount === null) {
    return message.reply("I don't know how to tip that many credits...").then(message => message.delete(5000));
  }

  if (message.mentions.users.first() && message.mentions.users.first().id) {
    return sendLBC(bot, message, tipper, message.mentions.users.first().id.replace('!', ''), amount, prv, MultiorRole);
  }
  message.reply('Sorry, I could not find a user in your tip...');
}

function doMultiTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (!words) {
    doHelp(message, helpmsg);
    return;
  }
  if (words.length < 4) {
    doTip(bot, message, tipper, words, helpmsg, MultiorRole);
    return;
  }
  let prv = false;
  if (words.length >= 5 && words[1] === 'private') {
    prv = true;
  }
  let [userIDs, amount] = findUserIDsAndAmount(message, words, prv);
  if (amount == null) {
    message.reply("I don't know how to tip that many credits...").then(message => message.delete(5000));
    return;
  }
  if (!userIDs) {
    message.reply('Sorry, I could not find a user in your tip...').then(message => message.delete(5000));
    return;
  }
  for (let i = 0; i < userIDs.length; i++) {
    sendLBC(bot, message, tipper, userIDs[i].toString(), amount, prv, MultiorRole);
  }
}

function doRoleTip(bot, message, tipper, words, helpmsg, MultiorRole) {
  if (!words || words.length < 3) {
    doHelp(message, helpmsg);
    return;
  }
  let prv = false;
  let amountOffset = 2;
  if (words.length >= 4 && words[1] === 'private') {
    prv = true;
    amountOffset = 3;
  }
  let amount = getValidatedAmount(words[amountOffset]);
  if (amount == null) {
    message.reply("I don't know how to tip that many LBC coins...").then(message => message.delete(10000));
    return;
  }
  if (message.mentions.roles.first().id) {
    if (message.mentions.roles.first().members.first().id) {
      let userIDs = message.mentions.roles.first().members.map(member => member.user.id.replace('!', ''));
      for (let i = 0; i < userIDs.length; i++) {
        sendLBC(bot, message, tipper, userIDs[i], amount, prv, MultiorRole);
      }
    } else {
      return message.reply('Sorry, I could not find any users to tip in that role...').then(message => message.delete(10000));
    }
  } else {
    return message.reply('Sorry, I could not find any roles in your tip...').then(message => message.delete(10000));
  }
}

function findUserIDsAndAmount(message, words, prv) {
  let idList = [];
  let amount = null;
  let count = 0;
  let startOffset = 1;
  if (prv) startOffset = 2;
  let regex = new RegExp(/<@!?[0-9]+>/);
  for (let i = startOffset; i < words.length; i++) {
    if (regex.test(words[i])) {
      count++;
      idList.push(words[i].match(/[0-9]+/));
    } else {
      amount = getValidatedAmount(words[Number(count) + 1]);
      break;
    }
  }
  return [idList, amount];
}

function sendLBC(bot, message, tipper, recipient, amount, privacyFlag, MultiorRole) {
  getAddress(recipient.toString(), function(err, address) {
    if (err) {
      message.reply(err.message).then(message => message.delete(5000));
    } else {
      lbry.sendFrom(tipper, address, Number(amount), 1, null, null, function(err, txId) {
        if (err) {
          message.reply(err.message).then(message => message.delete(5000));
        } else {
          let tx = txLink(txId);
          let msgtail = `
DM me with \`${message.content.split(' ', 1)[0]}\` for command specific instructions or with \`!tips\` for all available commands`;
          if (privacyFlag) {
            let usr = message.guild.members.find('id', recipient).user;
            let authmsg = `You have just privately tipped @${usr.tag} ${amount} LBC.
${tx}${msgtail}`;
            message.author.send(authmsg);
            if (message.author.id !== message.mentions.users.first().id) {
              let recipientmsg = `You have just been privately tipped ${amount} LBC by @${message.author.tag}.
${tx}${msgtail}`;
              usr.send(recipientmsg);
            }
          } else {
            let generalmsg = `Wubba lubba dub dub! <@${tipper}> tipped <@${recipient}> ${amount} LBC.
${tx}${msgtail}`;
            message.reply(generalmsg);
          }
        }
      });
    }
  });
}

function getAddress(userId, cb) {
  lbry.getAddressesByAccount(userId, function(err, addresses) {
    if (err) {
      cb(err);
    } else if (addresses.length > 0) {
      cb(null, addresses[0]);
    } else {
      lbry.getNewAddress(userId, function(err, address) {
        if (err) {
          cb(err);
        } else {
          cb(null, address);
        }
      });
    }
  });
}

function inPrivateOrBotSandbox(msg) {
  return msg.channel.type === 'dm' || msg.channel.id === spamchannel;
}

function getValidatedAmount(amount) {
  amount = amount.trim();
  if (amount.toLowerCase().endsWith('lbc')) {
    amount = amount.substring(0, amount.length - 3);
  }
  return amount.match(/^[0-9]+(\.[0-9]+)?$/) ? amount : null;
}

function txLink(txId) {
  return '<https://explorer.lbry.io/tx/' + txId + '>';
}

function formatDescriptions(msgparts) {
  return msgparts
    .map(
      elem => `\t**${elem[0]}**
\t\t${elem[1]}
`
    )
    .join('');
}
