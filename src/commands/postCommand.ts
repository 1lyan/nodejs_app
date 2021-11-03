import { IncomingMessage, ServerResponse } from 'http';
import { logger } from '../logger';

const postCommand = (request: IncomingMessage, response: ServerResponse) => {
  const chunks: any[] = [];
  let body = null;
  request.on('data', (chunk) => {
      chunks.push(chunk);
  }).on('end', () => {
      body = Buffer.concat(chunks).toString();
      logger.log('Request body', JSON.parse(body));
  });

  response.end(JSON.stringify({ message: 'POST request processed!' }));
}

export default postCommand;