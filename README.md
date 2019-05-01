# Bot for [LBRY's Discord](https://chat.lbry.com)
(This README will be updated along with bot updates)
Features:

- Tipbot for LBC. Responds to `!tip`.
- Dynamic plugin loading with permission support.



## Requirements

- node > 8.0.0
- npm > 0.12.x
- LBRYCrd (https://github.com/lbryio/lbrycrd/)

## Install the prerequisites
```
$ sudo apt-get install nodejs && apt-get update
```

```
$ wget https://github.com/lbryio/lbrycrd/releases/download/v0.12.4.0/lbrycrd-linux.zip
```

## Installation

Install LBRYCrd
```
$ unzip ~/lbrycrd-linux.zip
```
Follow the instructions on the LBRYCrds GitHub Repository to create a lbrycrd.conf and remember the username and password.

Start LBRYCrd 
```
./lbrycrdd -server -daemon
```

Create a bot and get the bot's API Token: https://discordapp.com/developers/applications/me - https://i.imgur.com/gM8EpJe.png

Make sure the bot has "bot" flags in OAuth2

```
$ cd lbry-tipbot/config
```
Then
```
$ vim default.json.example
```
Input your bots token, the channel ID for your bot command channel, and the username & password for LBRYCrd
Rename the configuration file to "default.json" with

```
$ mv default.json.example default.json
```

Then run npm install from within lbry-tipbot directory
```
npm install
node ~/lbry-tipbot/bot/bot.js
```
