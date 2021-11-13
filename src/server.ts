import express from "express";
import { Request, Response } from "express";
import { config } from "./config";
import { logger } from "./logger";
import { noAppPortMsg, noEnvMsg, noApiKeyMsg } from "./constants";
import OmdbService from "./services/omdbService";
import MovieStore from "./stores/movieStore";

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

const movieStore = new MovieStore();
const listenMessage = `Listening on port: ${config.APP_PORT}. ENV is ${config.ENV}`;

/**
 * 1. Add new movie
 * 2. Update movie by ID
 * 3. Delete movie by ID
 * 4. List all movies
 * 5. Get movie by ID
 * */
app.post("/movies", async (request: Request, response: Response) => {
  const name = request.body.name;
  const data = await OmdbService.getMovie(name);

  if (data["imdbID"]) {
    movieStore.add(data);
    return response.status(200).json({
      message: `Movie found and added: ${name}`,
      data: data,
    });
  }

  movieStore.add(request.body);
  return response.status(200).json({
    message: `New movie added: ${name}`,
    data: request.body,
  });
});

app.patch("/movies/:id", async (request: Request, response: Response) => {
  let id: string = request.params.id;
  let comment: string = request.body.comment;
  let personalScore: number = request.body.personalScore;

  const movie = movieStore.findById(id);

  if (!movie) {
    return response.status(404).json({
      message: "Movie not found",
    });
  }

  movie["comment"] = comment;
  movie["personalScore"] = personalScore;

  return response.status(200).json({
    message: `Movie updated: ${movie.Title}`,
    data: movie,
  });
});

app.delete("/movies/:id", (request: Request, response: Response) => {
  let id: string = request.params.id;
  const movie = movieStore.findById(id);

  if (!movie) {
    return response.status(404).json({
      message: "Movie not found",
    });
  }

  movieStore.destroy(movie);

  return response.status(200).json({
    data: `Deleted OK. ${movie.Title}`,
    message: movie,
  });
});

app.get("/movies", (request: Request, response: Response) => {
  return response.status(200).json({
    data: movieStore.movies,
  });
});

app.get("/movies/:id", (request: Request, response: Response) => {
  let id: string = request.params.id;
  const movie = movieStore.findById(id);

  if (!movie) {
    return response.status(404).json({
      message: "Movie not found",
    });
  }

  return response.status(200).json({
    data: movie,
  });
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
