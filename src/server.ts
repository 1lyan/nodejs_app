import { createServer, IncomingMessage, ServerResponse } from 'http';
import { config } from './config';
import { logger } from './logger';
import { noAppPortMsg, noEnvMsg } from './constants';
import getCommand from './commands/getCommand';
import postCommand from './commands/postCommand';

if (config.APP_PORT === undefined) {
    logger.info(noAppPortMsg);
    throw new Error(noAppPortMsg);
}
  
if (config.ENV === undefined){
    logger.info(noEnvMsg);
    throw new Error(noEnvMsg);
}

const contentTypeHeader = { 'Content-Type': 'application/json' };
const message = `Listening on port: ${config.APP_PORT}. ENV is ${config.ENV}`;

createServer((request: IncomingMessage, response: ServerResponse) => {
    logger.info('New incoming request');
    logger.log('Request Type', request.method);

    response.writeHead(200, contentTypeHeader);
    switch(request.method){
        case 'GET':
            getCommand(request, response);
        break;

        case 'POST':
            postCommand(request, response);
        break;
    }

}).listen(config.APP_PORT, () => logger.info(message));

process.on('uncaughtException', (err, origin) => {
    logger.fatal('Something really bad happened');
    logger.log(err);
});

process.on('unhandledRejection', (err, origin) => {
    logger.fatal('Some other bad thing happened');
    logger.log(err);
});