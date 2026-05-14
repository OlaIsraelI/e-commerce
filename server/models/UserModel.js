const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    sessions: {
      type: [
        {
          sessionId: {
            type: String,
            required: true,
          },
          refreshToken: {
            type: String,
            required: true,
          },
          userAgent: String,
          ip: String,
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: String,
    otpExpires: Date,
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpLastSent: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
