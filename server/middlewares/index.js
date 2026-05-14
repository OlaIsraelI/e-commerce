const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const allowedOrigins = (env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsAllowList =
  allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins;

const setupMiddlewares = (app) => {
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin: (origin, callback) => {
        if (!origin || corsAllowList.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
      },
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "10kb" }));

  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  if (env.nodeEnv !== "test") {
    app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  }
};

module.exports = setupMiddlewares;
