const crypto = require("crypto");
const AppError = require("../utils/AppError");

/**
 * CSRF Token Storage
 * In production, consider using a proper session store (Redis)
 * For now, we'll use a simple in-memory store with token cleanup
 */
const csrfTokens = new Map();

// Clean up expired tokens every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
      if (value.expiresAt < now) {
        csrfTokens.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Generate a CSRF token for a user session
 * Tokens expire after 1 hour
 */
const generateCSRFToken = (sessionId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  csrfTokens.set(token, {
    sessionId,
    expiresAt,
  });

  return token;
};

/**
 * Verify CSRF token
 * Tokens are one-time use to prevent token reuse attacks
 */
const verifyCSRFToken = (token, sessionId) => {
  const tokenData = csrfTokens.get(token);

  if (!tokenData) {
    return false;
  }

  // Check if token is expired
  if (tokenData.expiresAt < Date.now()) {
    csrfTokens.delete(token);
    return false;
  }

  // Check if token belongs to the correct session
  if (tokenData.sessionId !== sessionId) {
    return false;
  }

  // Delete token after verification (one-time use)
  csrfTokens.delete(token);

  return true;
};

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens on state-changing requests (POST, PUT, PATCH, DELETE)
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for auth endpoints (they use strong validation)
  if (req.path.includes("/auth/login") || req.path.includes("/auth/register")) {
    return next();
  }

  // Get CSRF token from headers or body
  const token = req.headers["x-csrf-token"] || req.body?.csrfToken;

  if (!token) {
    return next(
      new AppError(
        "CSRF token missing. Please include X-CSRF-Token header or csrfToken in body.",
        403,
      ),
    );
  }

  // Get session ID from request
  const sessionId = req.auth?.sessionId;

  if (!sessionId) {
    return next(new AppError("Session ID not found. Please login again.", 401));
  }

  // Verify the CSRF token
  if (!verifyCSRFToken(token, sessionId)) {
    return next(
      new AppError(
        "Invalid or expired CSRF token. Please refresh the page and try again.",
        403,
      ),
    );
  }

  next();
};

/**
 * Middleware to attach CSRF token to response
 * Should be called before authenticated routes to provide fresh token
 */
const attachCSRFToken = (req, res, next) => {
  if (req.auth?.sessionId) {
    const token = generateCSRFToken(req.auth.sessionId);
    res.locals.csrfToken = token;
    res.setHeader("X-CSRF-Token", token);
  }

  next();
};

module.exports = {
  csrfProtection,
  attachCSRFToken,
  generateCSRFToken,
  verifyCSRFToken,
};
