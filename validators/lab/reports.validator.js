const Joi = require("joi");

const reportValidationSchema = Joi.object({
    user: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
    reportName: Joi.string().required(),
    indication: Joi.string().allow("").optional(),
    remarks: Joi.string().allow("").optional(),
});

module.exports = {
    reportValidationSchema,
};
