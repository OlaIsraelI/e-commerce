const express = require("express");
const router = express.Router();

const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");
const protect = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

const {
  createProduct,
  getProducts,
  getProductById,
} = require("../controllers/productController");

const productValidationRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number"),
  body("description").optional().isString().trim(),
];

const idValidation = [
  param("id").isMongoId().withMessage("Valid product id is required"),
];

router.post(
  "/",
  protect,
  authorize("admin"),
  productValidationRules,
  validate,
  createProduct,
);

router.get("/", getProducts);
router.get("/:id", idValidation, validate, getProductById);

module.exports = router;
