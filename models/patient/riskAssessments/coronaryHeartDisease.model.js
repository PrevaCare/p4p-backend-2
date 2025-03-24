const mongoose = require("mongoose");

const CoronaryHeartDiseaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    gender: {
      type: String,
      enum: ["M", "F", "O"],
      required: [true, "gender is required !"],
    },
    age: {
      type: Number,
      required: [true, "age is required !"],
    },
    // race 0= white, 1 = african American
    race: {
      type: Number,
      enum: [0, 1],
      required: [true, "race is required !"],
    },
    systolicBP: {
      type: Number,
      required: [true, "systolicBP is required !"],
    },
    onHypertensionMed: {
      type: Boolean,
      default: false,
    },
    diabetes: {
      type: Boolean,
      default: false,
    },
    smoker: {
      type: Boolean,
      default: false,
    },
    totalCholesterol: {
      type: Number,
      required: [true, "total Cholesterol is required !"],
    },
    hdlCholesterol: {
      type: Number,
      required: [true, "hdl Cholesterol is required !"],
    },
    riskPercentage: {
      type: Number,
      //   required: [true, "risk Percentage is required !"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "CoronaryHeartDiseaseAssessment",
  CoronaryHeartDiseaseSchema
);
