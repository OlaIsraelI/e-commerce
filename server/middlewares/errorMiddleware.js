module.exports = (err, req, res, next) => {
  console.error(err);

  if (err.name === "JsonWebTokenError") {
    err.message = "Invalid token";
    err.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    err.message = "Token expired";
    err.statusCode = 401;
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(err.details ? { errors: err.details } : {}),
  });
};
