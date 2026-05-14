const productService = require("../services/productService");
const asyncHandler = require("../utils/asyncHandler");

// CREATE PRODUCT
const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

// GET ALL PRODUCTS
const getProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts();

  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products,
  });
});

// GET PRODUCT BY ID
const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    data: product,
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};
