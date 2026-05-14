const errorMiddleware = require("../../server/middlewares/errorMiddleware");

describe("errorMiddleware", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test("formats validation errors", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    errorMiddleware(
      Object.assign(new Error("Validation Failed"), {
        statusCode: 400,
        details: [{ msg: "Valid email required" }],
      }),
      req,
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation Failed",
      errors: [{ msg: "Valid email required" }],
    });
  });

  test("normalizes JWT errors", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    errorMiddleware(
      Object.assign(new Error("invalid token"), { name: "JsonWebTokenError" }),
      req,
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token",
    });
  });
});
