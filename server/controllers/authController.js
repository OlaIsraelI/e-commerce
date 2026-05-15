const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} = require("../utils/cookies");

const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, getRefreshTokenCookieOptions());
};

const setAccessTokenCookie = (res, token) => {
  res.cookie("accessToken", token, getAccessTokenCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", getRefreshTokenCookieOptions());
};

const clearAccessTokenCookie = (res) => {
  res.clearCookie("accessToken", getAccessTokenCookieOptions());
};

// REGISTER
exports.register = asyncHandler(async (req, res) => {
  console.log("[auth/register] request received", {
    email: req.body?.email,
    hasName: !!req.body?.name,
    hasPhone: !!(req.body?.phone || req.body?.number),
  });

  const user = await authService.register(req.body);

  // Return registered user object (without sensitive fields)
  const responseUser =
    user && typeof user.toObject === "function" ? user.toObject() : { ...user };
  if (responseUser.password) responseUser.password = undefined;

  console.log("[auth/register] user created", {
    userId: responseUser._id,
    email: responseUser.email,
  });

  res.status(201).json({
    success: true,
    data: responseUser,
  });
});

// VERIFY OTP
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  await authService.verifyOTP(email, otp);

  res.status(200).json({
    success: true,
    message: "Account verified",
  });
});

// RESEND OTP
exports.resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  await authService.resendOTP(email);

  res.status(200).json({
    success: true,
    message: "OTP resent",
  });
});

// LOGIN
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const data = await authService.login(email, password, req);
  setAccessTokenCookie(res, data.accessToken);
  setRefreshTokenCookie(res, data.refreshToken);

  // Return only user data (tokens are in HTTP-only cookies)
  res.status(200).json({
    success: true,
    data: {
      user: data.user,
    },
  });
});

// REFRESH TOKEN
exports.refreshToken = asyncHandler(async (req, res) => {
  // Only read from cookies (not from request body for security)
  const token = req.cookies?.refreshToken;

  if (!token) {
    // Clear any existing cookies and return 401 Unauthorized
    // This signals to client that session is invalid and user needs to login
    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);
    throw new AppError("Session expired. Please login again.", 401);
  }

  const data = await authService.refreshToken(token);
  setAccessTokenCookie(res, data.accessToken);
  setRefreshTokenCookie(res, data.refreshToken);

  // Return success response only (tokens are in HTTP-only cookies)
  res.status(200).json({
    success: true,
    message: "Token refreshed",
  });
});

// GET CURRENT USER
exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// UPDATE CURRENT USER
exports.updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateMe(req.user.id, req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// FORGOT PASSWORD
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    message: "Reset email sent",
  });
});

// RESET PASSWORD
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError("Token and new password required", 400);
  }

  await authService.resetPassword(token, newPassword);

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});

// LOGOUT
exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id, req.auth?.sessionId);
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

// LOGOUT ALL SESSIONS
exports.logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out from all sessions",
  });
});

// GET SESSIONS
exports.getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getSessions(req.user.id);

  res.status(200).json({
    success: true,
    data: sessions,
  });
});

// DELETE ACCOUNT
exports.deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user.id);

  res.status(200).json({
    success: true,
    message: "Account deleted",
  });
});
