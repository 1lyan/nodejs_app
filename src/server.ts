import express from "express";
import { Request, Response, NextFunction } from "express";
import { STATUS_CODES } from "http";
import { config } from "./config";
import { logger } from "./logger";
import { noAppPortMsg, noEnvMsg, noApiKeyMsg } from "./constants";
import OmdbService from "./services/omdbService";

if (config.API_KEY === undefined) {
  logger.info(noApiKeyMsg);
  throw new Error(noApiKeyMsg);
}

if (config.APP_PORT === undefined) {
  logger.info(noAppPortMsg);
  throw new Error(noAppPortMsg);
}

if (config.ENV === undefined) {
  logger.info(noEnvMsg);
  throw new Error(noEnvMsg);
}

const app = express();
app.use(express.json());

const MOVIES: Array<{}> = [];
const listenMessage = `Listening on port: ${config.APP_PORT}. ENV is ${config.ENV}`;

/**
 * 1. Add new movie
 * 2. Update movie by ID
 * 3. Delete movie by ID
 * 4. List all movies
 * 5. Get movie by ID
 * */
app.post('/movies', async (request: Request, response: Response) => {
  let title: string = request.body.title;
  const data = await OmdbService.getMovie(title);

  if(data['imdbID']) {
    MOVIES.push(data);
    return response.status(200).json({
        message: 'Movie added'
    });
  }

  return response.status(404).json({message: 'Movie not added'});
});

app.patch('/movies/:id', async (request: Request, response: Response) => {

});

app.listen(config.APP_PORT, () => {
  logger.info(listenMessage);
});

process.on("uncaughtException", (err, origin) => {
  logger.fatal("Something really bad happened");
  logger.log(err);
});

process.on("unhandledRejection", (err, origin) => {
  logger.fatal("Some other bad thing happened");
  logger.log(err);
});
