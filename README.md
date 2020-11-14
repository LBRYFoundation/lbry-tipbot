# Bot for [LBRY's Discord](https://chat.lbry.com)
(This README will be updated along with bot updates)
Features:

- Tipbot for LBC. Responds to `!tip`.
- Dynamic plugin loading with permission support.



## Requirements

- node > 12.0.x
- yarn
- node-typescript
- LBRYCrd 0.17.x (https://github.com/lbryio/lbrycrd/)

## Install the prerequisites
### NodeJS & Typescript
```
Install NodeJS v12 for the Operating system you are running.
https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions-enterprise-linux-fedora-and-snap-packages

```
```
sudo apt install nodejs-typescript
```
### Install Yarn Globally
```
sudo npm install -g yarn
```
### Download LBRYCRD
```
Download the latest 0.17 release of LBRYcrd from the [Github](https://github.com/lbryio/lbrycrd/releases)

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

Create a bot and get the bot's API Token: https://discordapp.com/developers/applications/me - ![](https://i.imgur.com/gM8EpJe.png)

Make sure the bot has "bot" flags in OAuth2

```
$ cd lbry-tipbot/config
```
Then
```
$ vim default.json.example
```
Input your bot's token, the channel ID for your bot command channel, and the username & password for LBRYCrd
.  Then, Rename the configuration file to "default.json" with

```
$ mv default.json.example default.json
```

Then run yarn install from within lbry-tipbot directory
```
yarn install
yarn start
```

## License
[MIT](https://github.com/lbryio/lbry-tipbot/blob/master/LICENSE)
