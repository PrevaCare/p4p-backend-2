const Joi = require("joi");

const createHealthTrackerSchema = Joi.object({
  user: Joi.string(),
  steps: Joi.number(),
  caloriesBurnt: Joi.number(),
});

module.exports = {
  createHealthTrackerSchema,
};
