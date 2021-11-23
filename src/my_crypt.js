const jwt = require("jsonwebtoken");
const fs = require("fs");
// import { Algorithm } from "jsonwebtoken";
// const algorithm: Algorithm = "RS256";

const privateKey = fs.readFileSync("private.key");
const publicKey = fs.readFileSync("public.key");

const headers = {
  issuer: "Lohika",
  algorithm: "RS256",
};

const encrypt = (data) => {
  return jwt.sign({ payload: data }, privateKey, headers);
};

const decrypt = (token) => {
  return jwt.verify(token, publicKey, headers).payload;
};

module.exports = {
  encrypt,
  decrypt,
};
