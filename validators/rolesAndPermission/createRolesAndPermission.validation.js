const Joi = require("joi");

const createRolesAndPermissionSchema = Joi.object({
  role: Joi.object({
    name: Joi.string().required(),
  }).required(),
  permission: Joi.object({
    name: Joi.string().required(),
    actions: Joi.object({
      Corporate: Joi.array().items(
        Joi.string().valid("CREATE", "READ", "UPDATE")
      ),
      Doctor: Joi.array().items(Joi.string().valid("CREATE", "READ", "UPDATE")),
      Superadmin: Joi.array().items(
        Joi.string().valid("CREATE", "READ", "UPDATE", "DELETE")
      ),
    }).or("Corporate", "Doctor", "Superadmin"), // Ensures at least one of these fields is provided
  }).required(),
});

module.exports = { createRolesAndPermissionSchema };
