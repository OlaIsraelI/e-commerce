const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const getAccessTokenSecret = () => {
  return process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError("Not authorized, no token", 401);
  }

  const decoded = jwt.verify(token, getAccessTokenSecret());

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  if (user.tokenVersion !== decoded.tokenVersion) {
    throw new AppError("Session expired. Please login again.", 401);
  }

  const activeSession = (user.sessions || []).some(
    (session) => session.sessionId === decoded.sessionId,
  );

  if (!activeSession) {
    throw new AppError("Session expired. Please login again.", 401);
  }

  req.user = user;
  req.auth = decoded;

  next();
});

module.exports = protect;
