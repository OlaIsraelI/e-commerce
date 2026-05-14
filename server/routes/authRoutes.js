const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const NIGERIAN_PHONE_REGEX = /^(?:\+234|0)[789][01]\d{8}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const validate = require("../middlewares/validate");
const protect = require("../middlewares/authMiddleware");
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
  getSessions,
  deleteAccount,
  refreshToken,
} = require("../controllers/authController");

const registerValidation = [
  body("name").optional().isString().trim().isLength({ min: 2 }),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("number")
    .optional()
    .trim()
    .matches(NIGERIAN_PHONE_REGEX)
    .withMessage("Valid Nigerian phone number required"),
  body("phone")
    .optional()
    .trim()
    .matches(NIGERIAN_PHONE_REGEX)
    .withMessage("Valid Nigerian phone number required"),
  body("password")
    .matches(PASSWORD_REGEX)
    .withMessage(
      "Password must be at least 8 characters and include at least one letter and one number",
    ),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const verifyOtpValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
];

const forgotPasswordValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Token is required"),
  body("newPassword")
    .matches(PASSWORD_REGEX)
    .withMessage(
      "Password must be at least 8 characters and include at least one letter and one number",
    ),
];

const updateMeValidation = [
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email required"),
  body("phone")
    .optional()
    .matches(NIGERIAN_PHONE_REGEX)
    .withMessage("Valid Nigerian phone number required"),
  body("number")
    .optional()
    .matches(NIGERIAN_PHONE_REGEX)
    .withMessage("Valid Nigerian phone number required"),
  body().custom((value) => {
    if (
      !value ||
      (!Object.hasOwn(value, "name") &&
        !Object.hasOwn(value, "email") &&
        !Object.hasOwn(value, "phone") &&
        !Object.hasOwn(value, "number"))
    ) {
      throw new Error("At least one profile field is required");
    }

    return true;
  }),
];

router.post("/register", registerValidation, validate, register);
router.post("/verify-otp", verifyOtpValidation, validate, verifyOTP);
router.post("/resend-otp", forgotPasswordValidation, validate, resendOTP);
router.post("/login", loginValidation, validate, login);
router.post("/refresh", refreshToken);
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  forgotPassword,
);
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  resetPassword,
);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMeValidation, validate, updateMe);
router.post("/logout", protect, logout);
router.post("/logout-all", protect, logoutAll);
router.get("/sessions", protect, getSessions);
router.delete("/account", protect, deleteAccount);

module.exports = router;
