const jwt = require("jsonwebtoken");

const getAccessTokenSecret = () => {
  return process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
};

exports.generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
      sessionId: user.sessionId,
    },

    getAccessTokenSecret(),
    {
      expiresIn: "15m",
    },
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      tokenVersion: user.tokenVersion,
      sessionId: user.sessionId,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
