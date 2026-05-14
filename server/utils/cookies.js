const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
const fifteenMinutesInMilliseconds = 15 * 60 * 1000;

const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
  maxAge,
});

const getAccessTokenCookieOptions = () =>
  getCookieOptions(fifteenMinutesInMilliseconds);

const getRefreshTokenCookieOptions = () => ({
  ...getCookieOptions(sevenDaysInMilliseconds),
});

module.exports = {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
};
