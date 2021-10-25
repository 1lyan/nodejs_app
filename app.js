const config = require('./config');
if (config.APP_PORT === undefined) {
    console.log('Please, provide APP_PORT');
    return;
}
  
if (config.ENV === undefined){
    console.log('Please, provide ENV');
    return;
}

const http = require('http');

const message = `Listening on port: ${config.APP_PORT}. ENV is ${config.ENV}`;
http.createServer((request, response) => {
    console.log('New incoming request');
    response.writeHeader(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Hello, world!' }));
}).listen(config.APP_PORT, () => console.log(message));