const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ limit: "100kb" }));
app.use(express.static("public"));
app.use(cookieParser());

module.exports = app;
