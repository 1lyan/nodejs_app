const yargs = require('yargs');

module.exports = {
  APP_PORT: process.env.APP_PORT,
  ENV: yargs.argv._[0],
};