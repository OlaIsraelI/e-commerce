jest.mock("../../server/models/product", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

const Product = require("../../server/models/product");
const productService = require("../../server/services/productService");

describe("productService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a product", async () => {
    Product.create.mockResolvedValue({ _id: "product-1", name: "Shoes" });

    const product = await productService.createProduct({
      name: "Shoes",
      price: 120,
    });

    expect(Product.create).toHaveBeenCalledWith({
      name: "Shoes",
      price: 120,
    });
    expect(product).toEqual({ _id: "product-1", name: "Shoes" });
  });

  test("throws when required fields are missing", async () => {
    await expect(productService.createProduct({ price: 120 })).rejects.toThrow(
      "Name and price are required",
    );
  });

  test("returns products", async () => {
    Product.find.mockResolvedValue([{ _id: "product-1" }]);

    await expect(productService.getAllProducts()).resolves.toEqual([
      { _id: "product-1" },
    ]);
  });

  test("throws when no products exist", async () => {
    Product.find.mockResolvedValue([]);

    await expect(productService.getAllProducts()).rejects.toThrow(
      "No products found",
    );
  });

  test("returns a product by id", async () => {
    Product.findById.mockResolvedValue({ _id: "product-1" });

    await expect(productService.getProductById("product-1")).resolves.toEqual({
      _id: "product-1",
    });
  });
});
