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
  // Enhanced Helmet security headers
  app.use(
    helmet({
      // Strict-Transport-Security: Force HTTPS
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      // Prevent clickjacking attacks
      frameguard: {
        action: "deny",
      },
      // Prevent MIME type sniffing
      noSniff: true,
      // XSS Protection header (note: modern browsers prefer CSP)
      xssFilter: true,
      // Referrer policy to prevent information leaks
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          upgradeInsecureRequests: env.nodeEnv === "production" ? [] : null,
        },
      },
    }),
  );

  // CORS with credentials
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

  // Cookie parser for HTTP-only cookies
  app.use(cookieParser());

  // Body parser with size limit
  app.use(express.json({ limit: "10kb" }));

  // General rate limiting for API
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Morgan logging (skip in test environment)
  if (env.nodeEnv !== "test") {
    app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  }

  // Additional security middleware
  // Prevent Parameter Pollution attacks
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  // Security headers for additional protection
  app.use((req, res, next) => {
    // Prevent browsers from executing scripts in contexts outside the intended origin
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Prevent page from being rendered inside a frame (clickjacking protection)
    res.setHeader("X-Frame-Options", "DENY");

    // Enable XSS protection in older browsers
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Disable caching for sensitive pages
    if (req.path.includes("/auth") && req.method !== "GET") {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    next();
  });
};

module.exports = setupMiddlewares;
