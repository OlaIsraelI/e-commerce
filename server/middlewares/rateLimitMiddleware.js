const rateLimit = require("express-rate-limit");

/**
 * Stricter rate limiting for authentication endpoints
 * Prevents brute force attacks and OTP enumeration
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again later",
  skip: (req) => {
    // Skip rate limiting for admin or verified test users
    return req.user && req.user.role === "admin";
  },
});

/**
 * Rate limiting for registration endpoint
 * Prevents account enumeration and abuse
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registration attempts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many accounts created, please try again later",
  skipSuccessfulRequests: false, // Count successful attempts too
});

/**
 * Rate limiting for password reset/forgot password
 * Prevents account takeover and enumeration attacks
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many password reset attempts, please try again later",
});

/**
 * Rate limiting for OTP verification
 * Prevents brute force attacks on 6-digit codes
 */
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 OTP verification attempts per IP per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many OTP verification attempts, please try again later",
  // Key generator - rate limit by email to prevent one person from trying multiple emails
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.email || ""}`;
  },
});

/**
 * Rate limiting for OTP resend
 * Prevents spam and enumeration
 */
const otpResendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 resend attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many OTP resend attempts, please wait before trying again",
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.email || ""}`;
  },
});

module.exports = {
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
};
