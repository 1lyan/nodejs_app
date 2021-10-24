if (process.env.APP_PORT === undefined){
  console.log('Please, provide APP_PORT');
  return;
}

if (process.env.ENV === undefined){
  console.log('Please, provide ENV');
  return;
}

module.exports = {
  APP_PORT: process.env.APP_PORT,
  ENV: process.env.ENV,
};