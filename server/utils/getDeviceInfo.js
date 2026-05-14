const UAParser = require("ua-parser-js");

const getDeviceInfo = (req = {}) => {
  const parser = new UAParser(req.headers?.["user-agent"] || "");
  const ua = parser.getResult();

  return {
    userAgent:
      [ua.browser?.name, ua.os?.name].filter(Boolean).join(" on ") ||
      "Unknown device",
    ip:
      req.ip ||
      req.headers?.["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown",
  };
};

module.exports = getDeviceInfo;
