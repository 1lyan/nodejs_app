const pino = require('pino')();

export const logger = {
  log: (...msg: any) => {
    console.log(msg);
  },
  info: (msg: string) => {
    pino.info(msg);
  },
  fatal: (msg: string) => {
    pino.fatal(msg);
  }
}