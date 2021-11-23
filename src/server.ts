import express from "express";
import { Request, Response, Router } from "express";
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
import { authenticate, authorize, register, login } from "./commands/auth";

import * as mongoDB from "mongodb";
const MongoClient = mongoDB.MongoClient;

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

app.use(authenticate);

const movieStore = new MovieStore();
const listenMessage = `Listening on port: ${config.APP_PORT}. ENV is ${config.ENV}`;

app.post("/movies", authorize, async (request: Request, response: Response) => {
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
      user_id: request.requestUser._id,
    };
    await collection.insertOne(movie);
    return response.status(200).json({
      message: `New movie added: ${name}`,
      data: movie,
    });
  }

  const dbMovie = await collection.findOne({ imdbID: data["imdbID"] });
  // movie already exists in DB
  if (dbMovie) {
    return response.status(200).json({
      message: `Movie already exist in DB: ${name}`,
    });
  }

  // movie is found in IMDB but not in local DB - so let's add it
  if (!dbMovie) {
    const movie = {
      ...data,
      comment,
      personalScore,
      user_id: request.requestUser._id,
    };
    await collection.insertOne(movie);
    return response.status(200).json({
      message: `Movie found and added: ${name}`,
      data: movie,
    });
  }

  return response.status(404).json({
    message: `Movie not found: ${name}`,
  });
});

app.patch(
  "/movies/:id",
  authorize,
  async (request: Request, response: Response) => {
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
    return response.status(200).json({
      message: `Movie updated: ${movie.Title}`,
      data: movie,
    });
  }
);

app.patch(
  "/like_movie/:id",
  authorize,
  async (request: Request, response: Response) => {
    const client = await MongoClient.connect(DB_URL);
    const db = client.db("moviesDB");
    const collection = db.collection("movies");
    const users = db.collection("users");
    const user = request.requestUser;

    let id: string = request.params.id;
    const movie = await collection.findOne({ imdbID: id });

    if (!movie) {
      return response.status(404).json({
        message: "Movie not found",
      });
    }

    user.favMovies.push(movie["imdbID"]);
    await users.updateOne(
      { _id: user._id },
      { $set: { favMovies: user.favMovies } }
    );

    return response.status(200).json({
      message: `Favorite list updated`,
    });
  }
);

app.delete(
  "/movies/:id",
  authorize,
  async (request: Request, response: Response) => {
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

    await collection.deleteOne({ imdbID: id });

    return response.status(200).json({
      data: `Deleted OK. ${movie.Title}`,
      message: movie,
    });
  }
);

app.get("/movies", authorize, async (request: Request, response: Response) => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const collection = db.collection("movies");
  const user = request.requestUser;

  console.log("IDS", user.favMovies);
  const movies = await collection
    .find({ imdbID: { $in: user.favMovies } })
    .toArray();
  return response.status(200).json({
    data: movies,
  });
});

app.get(
  "/movies/:id",
  authorize,
  async (request: Request, response: Response) => {
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
  }
);

const authRouter = express.Router();

authRouter.post("/registration", register);

authRouter.post("/login", login);

app.use("/auth", authRouter);

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
