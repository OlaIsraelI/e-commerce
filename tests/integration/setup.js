const mongoose = require("mongoose");
const User = require("../../server/models/UserModel");
const Product = require("../../server/models/product");

process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT || "5000";
process.env.MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.EMAIL_USER = process.env.EMAIL_USER || "test@example.com";
process.env.EMAIL_PASS = process.env.EMAIL_PASS || "test-password";

const ensureDatabaseConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
};

const clearDatabase = async () => {
  await Promise.all([User.deleteMany({}), Product.deleteMany({})]);
};

const closeDatabaseConnection = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = {
  ensureDatabaseConnection,
  clearDatabase,
  closeDatabaseConnection,
};
