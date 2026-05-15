const express = require("express");
const path = require("path");
require("dotenv").config();

// imports
const connectDB = require("./config/db");
const { validateEnv } = require("./config/validateEnv");
const setupMiddlewares = require("./middlewares");
const productRoutes = require("./routes/productRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const {
  csrfProtection,
  attachCSRFToken,
} = require("./middlewares/csrfProtection");
const protect = require("./middlewares/authMiddleware");

const app = express();
const clientDir = path.resolve(__dirname, "..", "client");

// global middlewares
setupMiddlewares(app);

// serve static client over HTTP to avoid file:// module loading and CORS issues
app.use(express.static(clientDir));

// routes
app.use(
  "/api/products",
  protect,
  attachCSRFToken,
  csrfProtection,
  productRoutes,
);

app.use("/api/auth", authRoutes);

// base route
app.get("/", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

// error middleware (must be last)
app.use(errorMiddleware);

const start = async () => {
  validateEnv(env);
  await connectDB(env.mongoURI);

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

module.exports = app;
