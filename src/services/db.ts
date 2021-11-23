import { DB_URL } from "../constants";

const MongoClient = require("mongodb").MongoClient;
export const movies = async () => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  return db.collection("movies");
};

export const users = async () => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  return db.collection("users");
};
