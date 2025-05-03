const Joi = require("joi");

// Validator for creating a new package type
exports.createTypeValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().required().messages({
      "string.empty": "Type name is required",
      "any.required": "Type name is required",
    }),
    description: Joi.string().trim().allow("", null),
    isActive: Joi.boolean().default(true),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  next();
};

// Validator for updating a package type
exports.updateTypeValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().optional().messages({
      "string.empty": "Type name cannot be empty",
    }),
    description: Joi.string().trim().allow("", null),
    isActive: Joi.boolean().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  next();
};

// Validator for adding a subtype
exports.addSubtypeValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().required().messages({
      "string.empty": "Subtype name is required",
      "any.required": "Subtype name is required",
    }),
    description: Joi.string().trim().allow("", null),
    isActive: Joi.boolean().default(true),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  next();
};

// Validator for updating a subtype
exports.updateSubtypeValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().optional().messages({
      "string.empty": "Subtype name cannot be empty",
    }),
    description: Joi.string().trim().allow("", null),
    isActive: Joi.boolean().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  next();
};
