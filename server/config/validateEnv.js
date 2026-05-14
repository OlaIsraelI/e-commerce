const validateEnv = (env = process.env) => {
  const missing = [];

  if (!env.MONGO_URI) {
    missing.push("MONGO_URI");
  }

  if (!env.JWT_SECRET && !env.JWT_ACCESS_SECRET) {
    missing.push("JWT_SECRET or JWT_ACCESS_SECRET");
  }

  if (!env.JWT_REFRESH_SECRET) {
    missing.push("JWT_REFRESH_SECRET");
  }

  const hasBasicEmailAuth = env.EMAIL_USER && env.EMAIL_PASS;
  const hasOAuthEmailAuth =
    env.EMAIL_FROM &&
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_REFRESH_TOKEN;

  if (!hasBasicEmailAuth && !hasOAuthEmailAuth) {
    missing.push(
      "EMAIL_USER and EMAIL_PASS or EMAIL_FROM with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN",
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (!env.PORT || Number.isNaN(Number(env.PORT))) {
    throw new Error("PORT must be a valid number");
  }
};

module.exports = { validateEnv };
