const mongoose = require("mongoose");

const connectDB = async (uri = process.env.MONGO_URI) => {
  try {
    if (!uri) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(uri);

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
