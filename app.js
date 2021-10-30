const http = require('http');
const config = require('./config');
const log = require('./logger');

if (config.APP_PORT === undefined) {
    log('Please, provide APP_PORT');
    return;
}
  
if (config.ENV === undefined){
    log('Please, provide ENV');
    return;
}

const contentTypeHeader = { 'Content-Type': 'application/json' };
const message = `Listening on port: ${config.APP_PORT}. ENV is ${config.ENV}`;

http.createServer((request, response) => {
    log('New incoming request');
    response.writeHeader(200, contentTypeHeader);
    response.end(JSON.stringify({ message: 'Hello, world!' }));
}).listen(config.APP_PORT, () => log(message));