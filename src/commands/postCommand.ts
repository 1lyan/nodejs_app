import { IncomingMessage, ServerResponse } from 'http';
import { logger } from '../logger';

class PostCommand {
  request: IncomingMessage;
  response: ServerResponse;
  constructor(request: IncomingMessage, response: ServerResponse){
    this.request = request;
    this.response = response;
  }

  run(){
    const chunks: any[] = [];
    let body = null;
    this.request.on('data', (chunk) => {
        chunks.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(chunks).toString();
        logger.log('Request body', JSON.parse(body));
    });

    this.response.end(JSON.stringify({ message: 'POST request processed!' }));
  }
}

export default PostCommand;