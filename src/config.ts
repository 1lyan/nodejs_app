const yargs = require('yargs');
export const config = {
  APP_PORT: process.env.APP_PORT,
  ENV: yargs.argv._[0],
};