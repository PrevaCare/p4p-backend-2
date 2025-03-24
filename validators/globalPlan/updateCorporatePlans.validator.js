const Joi = require("joi");

// const CorporatePlanSchema = new mongoose.Schema({
//   plan: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "GlobalPlan",
//     required: true,
//   },
//   totalCount: {
//     type: Number,
//     required: true,
//   },
//   usedCount: {
//     type: Number,
//     default: 0,
//   },
// });

const updateCorporateGlobalPlans = Joi.object({
  plan: Joi.string().required(),
  totalCount: Joi.number().positive(),
  usedCount: Joi.number().positive().optional(),
});

module.exports = { updateCorporateGlobalPlans };
