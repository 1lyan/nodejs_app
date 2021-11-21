import express from "express";
import { Request, Response } from "express";
import { config } from "./config";
import { logger } from "./logger";
import {
  noAppPortMsg,
  noEnvMsg,
  noApiKeyMsg,
  defaultScore,
  DB_URL,
} from "./constants";
import OmdbService from "./services/omdbService";
import MovieStore from "./stores/movieStore";

const MongoClient = require("mongodb").MongoClient;

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
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const collection = db.collection("movies");

  const { name, comment, personalScore } = request.body;
  const data = await OmdbService.getMovie(name);

  // movie not found
  if (!data["imdbID"]) {
    // movie not found in IMDB - let's add it to local DB
    const movie = {
      imdbID: movieStore.nextId(),
      Title: name,
      comment,
      personalScore,
    };
    collection.insert(movie);
    return response.status(200).json({
      message: `New movie added: ${name}`,
      data: movie,
    });
  }

  // movie already exists in DB
  if (collection.findOne({ imdbID: data["imdbID"] })) {
    return response.status(200).json({
      message: `Movie already exist in DB: ${name}`,
    });
  }

  // movie is found in IMDB but not in local DB - so let's add it
  if (!collection.findOne({ imdbID: data["imdbID"] })) {
    const movie = { ...data, comment, personalScore };
    collection.insert(movie);
    return response.status(200).json({
      message: `Movie found and added: ${name}`,
      data: movie,
    });
  }

  return response.status(404).json({
    message: `Movie not found: ${name}`,
  });
});

app.patch("/movies/:id", async (request: Request, response: Response) => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const collection = db.collection("movies");

  let id: string = request.params.id;
  const { comment, personalScore } = request.body;

  const movie = await collection.findOne({ imdbID: id });

  if (!movie) {
    return response.status(404).json({
      message: "Movie not found",
    });
  }

  const updateFields: { [k: string]: any } = {};
  if (comment) {
    updateFields["comment"] = comment;
  }
  if (personalScore) {
    updateFields["personalScore"] = personalScore;
  }

  await collection.updateOne({ imdbID: id }, { $set: updateFields });
  console.log("MOVIE", movie);
  return response.status(200).json({
    message: `Movie updated: ${movie.Title}`,
    data: movie,
  });
});

app.delete("/movies/:id", async (request: Request, response: Response) => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const collection = db.collection("movies");

  let id: string = request.params.id;
  const movie = await collection.findOne({ imdbID: id });

  if (!movie) {
    return response.status(404).json({
      message: "Movie not found",
    });
  }

  collection.deleteOne({ imdbID: id });

  return response.status(200).json({
    data: `Deleted OK. ${movie.Title}`,
    message: movie,
  });
});

app.get("/movies", async (request: Request, response: Response) => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const collection = db.collection("movies");

  const movies = await collection.find().toArray();
  return response.status(200).json({
    data: movies,
  });
});

app.get("/movies/:id", async (request: Request, response: Response) => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const collection = db.collection("movies");

  let id: string = request.params.id;
  const movie = await collection.findOne({ imdbID: id });

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
