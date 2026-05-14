const crypto = require("crypto");
const User = require("../models/UserModel");
const sendEmail = require("../utils/sendEmail");
const { hashPassword, comparePassword } = require("../utils/hash");
const AppError = require("../utils/AppError");
const { generateOTP, hashOTP } = require("../utils/otp");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const getDeviceInfo = require("../utils/getDeviceInfo");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// REGISTER
exports.register = async (data) => {
  console.log("[authService.register] start", {
    email: data?.email,
    hasPhone: !!(data?.phone || data?.number),
  });

  const { number, phone, ...rest } = data;
  const email = data.email.toLowerCase().trim();
  const normalizedPhone = (phone || number || "").trim();

  const existing = await User.findOne({ email });
  if (existing) throw new AppError("User already exists", 400);

  console.log("[authService.register] no existing user found", { email });

  const hashed = await hashPassword(data.password);
  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  const user = await User.create({
    ...rest,
    email,
    ...(normalizedPhone ? { phone: normalizedPhone } : {}),
    password: hashed,
    otp: otpHash,
    otpExpires: Date.now() + 10 * 60 * 1000,
    otpAttempts: 0,
    otpLastSent: Date.now(),
  });

  console.log("[authService.register] user persisted", {
    userId: user?._id,
    email: user?.email,
  });

  try {
    await sendEmail(user.email, "Verify your account", `Your OTP is ${otp}`);
    console.log("[authService.register] verification email sent", {
      email: user.email,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }

  user.password = undefined;
  return user;
};

// GET CURRENT USER PROFILE
exports.getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.password = undefined;
  user.sessions = undefined;

  return user;
};

// UPDATE CURRENT USER PROFILE
exports.updateMe = async (userId, payload) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const updates = {};

  if (typeof payload.name === "string") {
    updates.name = payload.name.trim();
  }

  if (typeof payload.email === "string") {
    const normalizedEmail = payload.email.toLowerCase().trim();

    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser && String(existingUser._id) !== String(userId)) {
        throw new AppError("User already exists", 400);
      }
    }

    updates.email = normalizedEmail;
  }

  if (typeof payload.phone === "string" || typeof payload.number === "string") {
    updates.phone = (payload.phone || payload.number || "").trim();
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid fields provided for update", 400);
  }

  Object.assign(user, updates);
  await user.save();

  user.password = undefined;
  user.sessions = undefined;

  return user;
};

// VERIFY OTP
exports.verifyOTP = async (email, otp) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  if ((user.otpAttempts || 0) >= 5) {
    throw new AppError("Too many OTP attempts. Request a new OTP", 400);
  }

  if (user.otp !== hashOTP(otp)) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();
    throw new AppError("Invalid or expired OTP", 400);
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  user.otpLastSent = undefined;

  await user.save();
};

// RESEND OTP
exports.resendOTP = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (
    user.otpLastSent &&
    Date.now() - new Date(user.otpLastSent).getTime() < 60 * 1000
  ) {
    throw new AppError("Please wait before requesting another OTP", 400);
  }

  const otp = generateOTP();

  user.otp = hashOTP(otp);
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  user.otpAttempts = 0;
  user.otpLastSent = Date.now();

  await user.save();

  await sendEmail(user.email, "Resend OTP", `Your new OTP is ${otp}`);
};

// LOGIN
exports.login = async (email, password, req = {}) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) throw new AppError("User not found", 404);

  if (!user.isVerified) {
    throw new AppError("Please verify your account before logging in", 403);
  }

  const match = await comparePassword(password, user.password);
  if (!match) throw new AppError("Invalid credentials", 401);

  const sessionId = crypto.randomUUID();
  const authUser = { ...user.toObject(), sessionId };

  const accessToken = generateAccessToken(authUser);
  const refreshToken = generateRefreshToken(authUser);
  const refreshTokenHash = hashToken(refreshToken);
  const deviceInfo = getDeviceInfo(req);

  user.sessions = user.sessions || [];
  user.sessions.push({
    sessionId,
    refreshToken: refreshTokenHash,
    userAgent: deviceInfo.userAgent,
    ip: deviceInfo.ip,
  });
  await user.save();

  user.password = undefined;
  user.sessions = undefined;

  return { user, accessToken, refreshToken };
};

// FORGOT PASSWORD
exports.forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) throw new AppError("User not found", 404);

  const token = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

  await user.save();

  await sendEmail(normalizedEmail, "Password Reset", `Reset token: ${token}`);
};

// RESET PASSWORD
exports.resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Invalid or expired token", 400);

  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
};

// DELETE USER
exports.deleteAccount = async (userId) => {
  await User.findByIdAndDelete(userId);
};

// LOGOUT
exports.logout = async (userId, sessionId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.sessions = (user.sessions || []).filter(
    (session) => session.sessionId !== sessionId,
  );

  await user.save();
};

// LOGOUT ALL SESSIONS
exports.logoutAll = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.sessions = [];
  user.tokenVersion += 1;

  await user.save();
};

// GET SESSIONS
exports.getSessions = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return (user.sessions || []).map((session) => ({
    sessionId: session.sessionId,
    userAgent: session.userAgent,
    ip: session.ip,
    createdAt: session.createdAt,
  }));
};

// ROTATE REFRESH TOKEN
exports.refreshToken = async (token) => {
  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw new AppError("Session expired. Please login again.", 401);
  }

  if (user.tokenVersion !== decoded.tokenVersion) {
    throw new AppError("Session expired. Please login again.", 401);
  }

  const hashedToken = hashToken(token);
  user.sessions = user.sessions || [];
  const session = user.sessions.find(
    (currentSession) => currentSession.sessionId === decoded.sessionId,
  );

  if (!session || session.refreshToken !== hashedToken) {
    user.sessions = [];
    user.tokenVersion += 1;
    await user.save();

    throw new AppError("Session compromised. Please login again.", 401);
  }

  const authUser = { ...user.toObject(), sessionId: session.sessionId };
  const accessToken = generateAccessToken(authUser);
  const newRefreshToken = generateRefreshToken(authUser);
  session.refreshToken = hashToken(newRefreshToken);

  await user.save();

  user.sessions = undefined;

  return { user, accessToken, refreshToken: newRefreshToken };
};
