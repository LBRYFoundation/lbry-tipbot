export interface Config {
  bot: BotConfig;
  lbrycrd: LBRYCrdConfig;
  sandboxchannel: string;
}

export interface BotConfig {
  token: string;
  prefix: string;
  debug: boolean;
  intents: string[];
}

export interface LBRYCrdConfig {
  port: number;
  user: string;
  pass: string;
}