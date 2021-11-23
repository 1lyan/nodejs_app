import { Request, Response } from "express";
import { DB_URL } from "../constants";
const { encrypt, decrypt } = require("../my_crypt.js");

declare global {
  namespace Express {
    interface Request {
      requestUser: any;
    }
  }
}

const MongoClient = require("mongodb").MongoClient;

export const authenticate = async (req: Request, res: Response, next: any) => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const users = db.collection("users");

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.json({ error: "Token not found" }).status(404);
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const tokenData = decrypt(token);

    const user = await users.findOne({ email: tokenData.email });

    req.requestUser = user;
  } catch (err) {
    console.log(err);
  } finally {
    next();
  }
};

export const authorize = async (req: Request, res: Response, next: any) => {
  if (!req.requestUser) {
    res.json({ error: "User not found" }).status(404);
    return;
  }
  next();
};

export const register = async (req: Request, res: Response) => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const users = db.collection("users");

  const { email, pass } = req.body;
  users.insertOne({ email, pass, role: "user", favMovies: [] });

  res.status(201).json({ message: "User added" }).end();
};

export const login = async (req: Request, res: Response) => {
  const client = await MongoClient.connect(DB_URL);
  const db = client.db("moviesDB");
  const users = db.collection("users");

  const { email, pass } = req.body;
  const user = await users.findOne({ email: email, pass: pass });
  if (!user) {
    res.status(404).json({ error: "User not found" }).end();
  }
  console.log("USER FOUND? ", user);
  const token = encrypt({ email: user.email, role: user.role });
  res.json({ token: token }).end();
};
