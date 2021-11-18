import { IncomingMessage, ServerResponse } from "http";

const getCommand = (request: IncomingMessage, response: ServerResponse) => {
  response.end(JSON.stringify({ message: "Hello, world!" }));
};

export default getCommand;
