const Joi = require("joi");

const doctorBankDetailsValidation = {
  // Create validation
  create: Joi.object({
    doctor: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Invalid doctor ID format",
        "any.required": "Doctor ID is required",
      }),

    accountHolderName: Joi.string().required().trim().min(3).max(100).messages({
      "string.empty": "Account holder name is required",
      "string.min": "Account holder name must be at least 3 characters",
      "string.max": "Account holder name cannot exceed 100 characters",
    }),

    bankName: Joi.string().required().trim().min(2).max(100).messages({
      "string.empty": "Bank name is required",
      "string.min": "Bank name must be at least 2 characters",
      "string.max": "Bank name cannot exceed 100 characters",
    }),

    accountNumber: Joi.string()
      .required()
      .trim()
      .pattern(/^\d{9,18}$/)
      .messages({
        "string.pattern.base": "Account number must be between 9 and 18 digits",
        "string.empty": "Account number is required",
      }),

    ifscCode: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      .messages({
        "string.pattern.base": "Please enter a valid IFSC code",
        "string.empty": "IFSC code is required",
      }),

    branchName: Joi.string().required().trim().min(2).max(100).messages({
      "string.empty": "Branch name is required",
      "string.min": "Branch name must be at least 2 characters",
      "string.max": "Branch name cannot exceed 100 characters",
    }),

    accountType: Joi.string().required().valid("Savings", "Current").messages({
      "any.only": "Account type must be either Savings or Current",
      "string.empty": "Account type is required",
    }),

    panNumber: Joi.string()
      .required()
      .trim()
      .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
      .messages({
        "string.pattern.base": "Please enter a valid PAN number",
        "string.empty": "PAN number is required",
      }),

    isVerified: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true),
  }),

  // Update validation - allowing empty strings for optional fields
  update: Joi.object({
    accountHolderName: Joi.string().allow("").trim().min(3).max(100).messages({
      "string.min": "Account holder name must be at least 3 characters",
      "string.max": "Account holder name cannot exceed 100 characters",
    }),

    bankName: Joi.string().allow("").trim().min(2).max(100).messages({
      "string.min": "Bank name must be at least 2 characters",
      "string.max": "Bank name cannot exceed 100 characters",
    }),

    branchName: Joi.string().allow("").trim().min(2).max(100).messages({
      "string.min": "Branch name must be at least 2 characters",
      "string.max": "Branch name cannot exceed 100 characters",
    }),

    accountType: Joi.string().allow("").valid("Savings", "Current").messages({
      "any.only": "Account type must be either Savings or Current",
    }),

    isVerified: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }),
};

module.exports = { doctorBankDetailsValidation };
// // Example usage in a middleware
// const validateBankDetails = (validationType) => {
//   return async (req, res, next) => {
//     try {
//       const schema = doctorBankDetailsValidation[validationType];
//       await schema.validateAsync(req.body, { abortEarly: false });
//       next();
//     } catch (error) {
//       const errors = error.details.map(detail => ({
//         field: detail.context.key,
//         message: detail.message
//       }));
//       return res.status(400).json({ errors });
//     }
//   };
// };

// // Usage in routes
// router.post(
//   '/bank-details',
//   validateBankDetails('create'),
//   createBankDetails
// );

// router.patch(
//   '/bank-details/:id',
//   validateBankDetails('update'),
//   updateBankDetails
// );
