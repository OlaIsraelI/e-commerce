const Product = require("../models/product");
const AppError = require("../utils/AppError");

const createProduct = async (data) => {
  if (!data.name || !data.price) {
    throw new AppError("Name and price are required", 400);
  }

  const product = await Product.create(data);
  return product;
};

const getAllProducts = async () => {
  const products = await Product.find();

  if (!products || products.length === 0) {
    throw new AppError("No products found", 404);
  }

  return products;
};

const getProductById = async (id) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
};
