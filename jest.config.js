module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: ["server/**/*.js", "!server/app.js"],
  testTimeout: 30000,
};
