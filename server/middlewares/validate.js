const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new AppError("Validation Failed", 400, errors.array()));
  }

  next();
};

module.exports = validate;
