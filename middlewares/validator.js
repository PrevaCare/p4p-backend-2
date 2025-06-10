const Joi = require('joi');
const Response = require('../utils/Response');
const AppConstant = require('../utils/AppConstant');

const validator = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return Response.error(res, 400, AppConstant.FAILED, errorMessage);
    }

    next();
  };
};

module.exports = validator; 