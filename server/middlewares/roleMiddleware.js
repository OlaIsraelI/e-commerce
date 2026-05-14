const AppError = require("../utils/AppError");

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if(!roles.includes(req.user.role)){
      return next(new AppError("Forbidden", 403));
    }

    next();
  };
};