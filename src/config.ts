const yargs = require("yargs");
export const config = {
  APP_PORT: process.env.APP_PORT,
  API_KEY: process.env.API_KEY,
  ENV: yargs.argv._[0],
};
