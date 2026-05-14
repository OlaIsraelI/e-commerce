jest.mock("dotenv", () => ({ config: jest.fn() }));

const request = require("supertest");
const crypto = require("crypto");
const {
  ensureDatabaseConnection,
  clearDatabase,
  closeDatabaseConnection,
} = require("./setup");

const app = require("../../server/app");
const User = require("../../server/models/UserModel");
const { hashPassword } = require("../../server/utils/hash");
const { generateAccessToken } = require("../../server/utils/jwt");

const createAdminAccessToken = async () => {
  const sessionId = crypto.randomUUID();
  const admin = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: await hashPassword("password123"),
    role: "admin",
    isVerified: true,
    sessions: [
      {
        sessionId,
        refreshToken: "seeded-refresh-token-hash",
      },
    ],
  });

  return generateAccessToken({
    _id: admin._id,
    role: admin.role,
    tokenVersion: admin.tokenVersion,
    sessionId,
  });
};

describe("product routes", () => {
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

  test("creates and reads products from the database", async () => {
    const accessToken = await createAdminAccessToken();

    const createResponse = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Laptop",
        price: 1499,
        description: "Portable workstation",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.name).toBe("Laptop");

    const listResponse = await request(app).get("/api/products");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const productId = createResponse.body.data._id;
    const itemResponse = await request(app).get(`/api/products/${productId}`);

    expect(itemResponse.status).toBe(200);
    expect(itemResponse.body.data._id).toBe(productId);
    expect(itemResponse.body.data.name).toBe("Laptop");
  });

  test("returns validation errors for invalid product payloads", async () => {
    const accessToken = await createAdminAccessToken();

    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ price: 99 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual(expect.any(Array));
  });
});
