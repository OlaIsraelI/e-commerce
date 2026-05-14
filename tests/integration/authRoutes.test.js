jest.mock("dotenv", () => ({ config: jest.fn() }));
jest.mock("../../server/utils/sendEmail", () =>
  jest.fn(() => Promise.resolve()),
);
jest.mock("../../server/utils/otp", () => ({
  generateOTP: jest
    .fn()
    .mockReturnValueOnce("123456")
    .mockReturnValueOnce("654321")
    .mockReturnValue("123456"),
  hashOTP: jest.fn((otp) =>
    require("crypto").createHash("sha256").update(String(otp)).digest("hex"),
  ),
}));

const request = require("supertest");
const {
  ensureDatabaseConnection,
  clearDatabase,
  closeDatabaseConnection,
} = require("./setup");

const app = require("../../server/app");
const User = require("../../server/models/UserModel");
const { hashOTP } = require("../../server/utils/otp");

describe("auth routes", () => {
  let consoleErrorSpy;

  beforeAll(async () => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await ensureDatabaseConnection();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    consoleErrorSpy.mockRestore();
    await closeDatabaseConnection();
  });

  test("registers, verifies, and logs in a user against a real database", async () => {
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.data.email).toBe("test@example.com");

    const storedUser = await User.findOne({ email: "test@example.com" });
    expect(storedUser).toBeTruthy();
    expect(storedUser.isVerified).toBe(false);
    expect(storedUser.otp).toBe(hashOTP("123456"));

    const verifyResponse = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "test@example.com", otp: "123456" });

    expect(verifyResponse.status).toBe(200);

    const verifiedUser = await User.findOne({ email: "test@example.com" });
    expect(verifiedUser.isVerified).toBe(true);
    expect(verifiedUser.otp).toBeUndefined();

    await verifiedUser.updateOne({
      isVerified: false,
      otp: hashOTP("123456"),
      otpExpires: Date.now() + 10 * 60 * 1000,
      otpAttempts: 0,
      otpLastSent: Date.now() - 61 * 1000,
    });

    const resendResponse = await request(app)
      .post("/api/auth/resend-otp")
      .send({ email: "test@example.com" });

    expect(resendResponse.status).toBe(200);

    const resentUser = await User.findOne({ email: "test@example.com" });
    expect(resentUser.otp).toBe(hashOTP("654321"));
    expect(resentUser.otpAttempts).toBe(0);

    const reverifyResponse = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "test@example.com", otp: "654321" });

    expect(reverifyResponse.status).toBe(200);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.data.refreshToken).toEqual(expect.any(String));
    expect(loginResponse.body.data.user.email).toBe("test@example.com");
    expect(loginResponse.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );

    const accessToken = loginResponse.body.data.accessToken;

    const updateProfileResponse = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Updated Test User",
        phone: "+2347000000000",
      });

    expect(updateProfileResponse.status).toBe(200);
    expect(updateProfileResponse.body.success).toBe(true);
    expect(updateProfileResponse.body.data.name).toBe("Updated Test User");
    expect(updateProfileResponse.body.data.phone).toBe("+2347000000000");

    const updatedProfileUser = await User.findOne({
      email: "test@example.com",
    });
    expect(updatedProfileUser.name).toBe("Updated Test User");
    expect(updatedProfileUser.phone).toBe("+2347000000000");

    const sessionsResponse = await request(app)
      .get("/api/auth/sessions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(sessionsResponse.status).toBe(200);
    expect(sessionsResponse.body.data).toHaveLength(1);
    expect(sessionsResponse.body.data[0]).toEqual(
      expect.objectContaining({
        sessionId: expect.any(String),
        userAgent: expect.any(String),
        ip: expect.any(String),
        createdAt: expect.any(String),
      }),
    );

    const refreshCookie = loginResponse.headers["set-cookie"].find((cookie) =>
      cookie.includes("refreshToken="),
    );
    const refreshToken = refreshCookie.split(";")[0].split("=")[1];

    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.data.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(logoutResponse.status).toBe(200);

    const sessionsAfterLogout = await request(app)
      .get("/api/auth/sessions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(sessionsAfterLogout.status).toBe(401);
  });

  test("rejects invalid profile update payloads", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Validation User",
      email: "validation@example.com",
      password: "password123",
    });

    await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "validation@example.com", otp: "123456" });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "validation@example.com",
      password: "password123",
    });

    expect(loginResponse.status).toBe(200);

    const accessToken = loginResponse.body.data.accessToken;

    const emptyPayloadResponse = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(emptyPayloadResponse.status).toBe(400);
    expect(emptyPayloadResponse.body.success).toBe(false);
    expect(emptyPayloadResponse.body.message).toBe("Validation Failed");

    const invalidEmailResponse = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: "not-an-email" });

    expect(invalidEmailResponse.status).toBe(400);
    expect(invalidEmailResponse.body.success).toBe(false);
    expect(invalidEmailResponse.body.message).toBe("Validation Failed");
    expect(invalidEmailResponse.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "Valid email required",
        }),
      ]),
    );
  });

  test("rejects reset password with weak password", async () => {
    const response = await request(app).post("/api/auth/reset-password").send({
      token: "sample-reset-token",
      newPassword: "12345678",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation Failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "Password must be at least 8 characters and include at least one letter and one number",
        }),
      ]),
    );
  });
});
