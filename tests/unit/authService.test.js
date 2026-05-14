jest.mock("../../server/models/UserModel", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock("../../server/utils/hash", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock("../../server/utils/otp", () => ({
  generateOTP: jest.fn(() => "123456"),
  hashOTP: jest.fn((otp) => `hashed-${otp}`),
}));
jest.mock("../../server/utils/sendEmail", () =>
  jest.fn(() => Promise.resolve()),
);
jest.mock("../../server/utils/jwt", () => ({
  generateAccessToken: jest.fn(() => "access-token"),
  generateRefreshToken: jest.fn(() => "refresh-token"),
  verifyRefreshToken: jest.fn(() => ({
    id: "user-1",
    tokenVersion: 0,
    sessionId: "session-1",
  })),
}));

const crypto = require("crypto");
const User = require("../../server/models/UserModel");
const { hashPassword, comparePassword } = require("../../server/utils/hash");
const { generateOTP, hashOTP } = require("../../server/utils/otp");
const sendEmail = require("../../server/utils/sendEmail");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../../server/utils/jwt");
const authService = require("../../server/services/authService");

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registers a new user and sends a verification email", async () => {
    User.findOne.mockResolvedValue(null);
    hashPassword.mockResolvedValue("hashed-password");

    User.create.mockResolvedValue({
      _id: "user-1",
      email: "test@example.com",
      password: "hashed-password",
      save: jest.fn(),
    });

    const result = await authService.register({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        email: "test@example.com",
        password: "hashed-password",
        otp: "hashed-123456",
        otpAttempts: 0,
      }),
    );
    expect(generateOTP).toHaveBeenCalled();
    expect(hashOTP).toHaveBeenCalledWith("123456");
    expect(sendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "Verify your account",
      "Your OTP is 123456",
    );
    expect(result.password).toBeUndefined();
  });

  test("logs in a user and stores a hashed session token", async () => {
    const user = {
      _id: "user-1",
      role: "user",
      tokenVersion: 0,
      isVerified: true,
      isVerified: true,
      sessions: [],
      password: "hashed-password",
      save: jest.fn(),
      toObject: jest.fn(function toObject() {
        return {
          _id: this._id,
          role: this.role,
          tokenVersion: this.tokenVersion,
        };
      }),
    };

    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    comparePassword.mockResolvedValue(true);

    const result = await authService.login("test@example.com", "password123", {
      headers: { "user-agent": "Chrome on Windows" },
      ip: "127.0.0.1",
    });

    expect(comparePassword).toHaveBeenCalledWith(
      "password123",
      "hashed-password",
    );
    expect(generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "user-1",
        role: "user",
        tokenVersion: 0,
        sessionId: expect.any(String),
      }),
    );
    expect(generateRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "user-1",
        tokenVersion: 0,
        sessionId: expect.any(String),
      }),
    );
    expect(user.save).toHaveBeenCalled();
    expect(result.user.password).toBeUndefined();
    expect(result.user.sessions).toBeUndefined();
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
  });

  test("rotates a refresh token when it matches the stored hash", async () => {
    const storedHash = crypto
      .createHash("sha256")
      .update("refresh-token")
      .digest("hex");

    const user = {
      _id: "user-1",
      role: "user",
      tokenVersion: 0,
      isVerified: true,
      sessions: [
        {
          sessionId: "session-1",
          refreshToken: storedHash,
        },
      ],
      save: jest.fn(),
      toObject: jest.fn(function toObject() {
        return {
          _id: this._id,
          role: this.role,
          tokenVersion: this.tokenVersion,
        };
      }),
    };

    User.findById.mockResolvedValue(user);

    const result = await authService.refreshToken("refresh-token");

    expect(verifyRefreshToken).toHaveBeenCalledWith("refresh-token");
    expect(generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "user-1",
        tokenVersion: 0,
        sessionId: "session-1",
      }),
    );
    expect(generateRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "user-1",
        tokenVersion: 0,
        sessionId: "session-1",
      }),
    );
    expect(user.save).toHaveBeenCalled();
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
  });

  test("rejects refresh token reuse mismatches", async () => {
    const user = {
      _id: "user-1",
      tokenVersion: 0,
      sessions: [
        {
          sessionId: "session-1",
          refreshToken: "different-hash",
        },
      ],
      save: jest.fn(),
    };

    User.findById.mockResolvedValue(user);

    await expect(authService.refreshToken("refresh-token")).rejects.toThrow(
      "Session compromised. Please login again.",
    );
    expect(user.tokenVersion).toBe(1);
    expect(user.sessions).toEqual([]);
    expect(user.save).toHaveBeenCalled();
  });

  test("rejects unverified users at login", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "user-1",
        role: "user",
        isVerified: false,
        password: "hashed-password",
      }),
    });
    comparePassword.mockResolvedValue(true);

    await expect(
      authService.login("test@example.com", "password123"),
    ).rejects.toThrow("Please verify your account before logging in");
  });

  test("rejects invalid credentials", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "user-1",
        role: "user",
        isVerified: true,
        password: "hashed-password",
      }),
    });
    comparePassword.mockResolvedValue(false);

    await expect(
      authService.login("test@example.com", "wrong-password"),
    ).rejects.toThrow("Invalid credentials");
  });

  test("creates a password reset token", async () => {
    const user = { save: jest.fn() };
    User.findOne.mockResolvedValue(user);

    await authService.forgotPassword("test@example.com");

    expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(user.save).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "Password Reset",
      expect.stringContaining("Reset token:"),
    );
  });

  test("verifies a valid OTP and clears the stored token", async () => {
    const user = {
      otp: "hashed-123456",
      otpExpires: Date.now() + 10 * 60 * 1000,
      otpAttempts: 0,
      save: jest.fn(),
    };

    User.findOne.mockResolvedValue(user);

    await authService.verifyOTP("test@example.com", "123456");

    expect(hashOTP).toHaveBeenCalledWith("123456");
    expect(user.isVerified).toBe(true);
    expect(user.otp).toBeUndefined();
    expect(user.otpExpires).toBeUndefined();
    expect(user.otpAttempts).toBe(0);
    expect(user.save).toHaveBeenCalled();
  });

  test("increments OTP attempts on invalid verification", async () => {
    const user = {
      otp: "hashed-123456",
      otpExpires: Date.now() + 10 * 60 * 1000,
      otpAttempts: 1,
      save: jest.fn(),
    };

    User.findOne.mockResolvedValue(user);

    await expect(
      authService.verifyOTP("test@example.com", "999999"),
    ).rejects.toThrow("Invalid or expired OTP");

    expect(user.otpAttempts).toBe(2);
    expect(user.save).toHaveBeenCalled();
  });

  test("resends OTP with a fresh hash and cooldown reset", async () => {
    const user = {
      email: "test@example.com",
      otpLastSent: Date.now() - 61 * 1000,
      save: jest.fn(),
    };

    User.findOne.mockResolvedValue(user);

    await authService.resendOTP("test@example.com");

    expect(generateOTP).toHaveBeenCalled();
    expect(hashOTP).toHaveBeenCalledWith("123456");
    expect(user.otp).toBe("hashed-123456");
    expect(user.otpAttempts).toBe(0);
    expect(user.otpExpires).toEqual(expect.any(Number));
    expect(user.save).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "Resend OTP",
      "Your new OTP is 123456",
    );
  });

  test("logs out by removing a single session", async () => {
    const user = {
      sessions: [{ sessionId: "session-1" }, { sessionId: "session-2" }],
      save: jest.fn(),
    };
    User.findById.mockResolvedValue(user);

    await authService.logout("user-1", "session-1");

    expect(user.sessions).toEqual([{ sessionId: "session-2" }]);
    expect(user.save).toHaveBeenCalled();
  });

  test("logs out all sessions and increments token version", async () => {
    const user = {
      tokenVersion: 0,
      sessions: [{ sessionId: "session-1" }],
      save: jest.fn(),
    };

    User.findById.mockResolvedValue(user);

    await authService.logoutAll("user-1");

    expect(user.sessions).toEqual([]);
    expect(user.tokenVersion).toBe(1);
    expect(user.save).toHaveBeenCalled();
  });

  test("returns active sessions without refresh token hashes", async () => {
    const user = {
      sessions: [
        {
          sessionId: "session-1",
          refreshToken: "hash",
          userAgent: "Chrome on Windows",
          ip: "127.0.0.1",
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      ],
    };

    User.findById.mockResolvedValue(user);

    const sessions = await authService.getSessions("user-1");

    expect(sessions).toEqual([
      {
        sessionId: "session-1",
        userAgent: "Chrome on Windows",
        ip: "127.0.0.1",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ]);
  });

  test("resets the user password", async () => {
    const user = { save: jest.fn() };
    User.findOne.mockResolvedValue(user);
    hashPassword.mockResolvedValue("new-hash");

    await authService.resetPassword("reset-token", "new-password");

    expect(User.findOne).toHaveBeenCalledWith({
      resetPasswordToken: "reset-token",
      resetPasswordExpires: { $gt: expect.any(Number) },
    });
    expect(hashPassword).toHaveBeenCalledWith("new-password");
    expect(user.save).toHaveBeenCalled();
  });
});
