const mongoose = require("mongoose");

const DietaryHabitSchema = new mongoose.Schema({
  regularMeals: {
    type: Boolean,
    default: false,
  },
  frequentSnacks: {
    type: Boolean,
    default: false,
  },
  processedFoods: {
    type: Boolean,
    default: false,
  },
  sodaJuices: {
    type: Boolean,
    default: false,
  },
  restaurantFood: {
    type: Boolean,
    default: false,
  },
});

const LiverRiskCalculatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    age: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },

    riskReasons: {
      type: [String],
    },
    diabetes: {
      type: String,
      trim: true,
    },
    highBloodPressure: {
      type: String,
      trim: true,
    },
    exercise: {
      type: String,
      trim: true,
    },
    alcohol: {
      type: String,
      trim: true,
    },
    dietaryHabits: DietaryHabitSchema,
    riskScore: {
      type: Number,
      trim: [true, "risk score is required !"],
    },
    riskLevel: {
      type: String,
      trim: [true, "risk level is required !"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "LiverRiskCalculator",
  LiverRiskCalculatorSchema
);
