import express from "express";
import { Request, Response } from "express";
import { config } from "./config";
import { logger } from "./logger";
import {
  noAppPortMsg,
  noEnvMsg,
  noApiKeyMsg,
} from "./constants";
import OmdbService from "./services/omdbService";
import { authenticate, authorize, register, login } from "./commands/auth";

import { movies, users, nextId } from "./services/db";

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

const listenMessage = `Listening on port: ${config.APP_PORT}. ENV is ${config.ENV}`;

app.post("/movies", async (request: Request, response: Response) => {
  const collection = await movies();
  const user = request.requestUser;

  const { name, comment, personalScore } = request.body;
  const data = await OmdbService.getMovie(name);
  let movie = {};

  // movie not found
  if (!data["imdbID"]) {
    // movie not found in IMDB - let's add it to local DB
    movie = {
      imdbID: nextId(),
      Title: name,
      comment,
      personalScore,
      user_id: user._id,
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
    movie = { ...data, comment, personalScore, user_id: user._id };
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
    const collection = await movies();

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
      message: `Movie updated: ${movie.Title}`
    });
  }
);

app.patch(
  "/like_movie/:id",
  authorize,
  async (request: Request, response: Response) => {
    const _movies = await movies();
    const _users = await users();
    const user = request.requestUser;

    let id: string = request.params.id;
    const movie = await _movies.findOne({ imdbID: id });

    if (!movie) {
      return response.status(404).json({
        message: "Movie not found",
      });
    }

    user.favMovies.push(movie["imdbID"]);
    await _users.updateOne(
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
    const collection = await movies();

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
  const collection = await movies();
  const user = request.requestUser;

  const items = await collection.find({ imdbID: { $in: user.favMovies } }).toArray();
  return response.status(200).json({
    data: items,
  });
});

app.get(
  "/movies/:id",
  authorize,
  async (request: Request, response: Response) => {
    const collection = await movies();

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
