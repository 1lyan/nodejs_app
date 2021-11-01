import { IncomingMessage, ServerResponse } from 'http';

class GetCommand {
  request: IncomingMessage;
  response: ServerResponse;
  constructor(request: IncomingMessage, response: ServerResponse){
    this.request = request;
    this.response = response;
  }

  run(){
    this.response.end(JSON.stringify({ message: 'Hello, world!' }));
  }
}

export default GetCommand;