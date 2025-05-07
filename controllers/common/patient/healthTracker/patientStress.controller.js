const patientStressModel = require("../../../../models/patient/healthTracker/stress/patientStress.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const dayjs = require("dayjs");
const {
  patientStressValidationSchema,
  stressByDateRangeValidationSchema,
  validQuestionKeys,
} = require("../../../../validators/patient/healthTracker/patientStress.validator");
const {
  reverseScoreQuestions,
  stressLevelInterpretation,
} = require("./pssQuestions.helper");

// Calculate stress level and recommendation based on total score
const calculateStressLevelAndRecommendation = (totalScore) => {
  let stressLevel, recommendation;

  if (totalScore >= 0 && totalScore <= 13) {
    stressLevel = "Low";
    recommendation = stressLevelInterpretation.Low.recommendation;
  } else if (totalScore >= 14 && totalScore <= 26) {
    stressLevel = "Moderate";
    recommendation = stressLevelInterpretation.Moderate.recommendation;
  } else {
    stressLevel = "High";
    recommendation = stressLevelInterpretation.High.recommendation;
  }

  return { stressLevel, recommendation };
};

// Calculate the total stress score with reverse scoring for specific questions
const calculateStressScore = (responses) => {
  let totalScore = 0;

  responses.forEach((response) => {
    const { questionKey, response: score } = response;

    // Apply reverse scoring for specific questions
    if (reverseScoreQuestions.includes(questionKey)) {
      totalScore += 4 - score; // Reverse scoring: 0=4, 1=3, 2=2, 3=1, 4=0
    } else {
      totalScore += score;
    }
  });

  return totalScore;
};

// Create Stress Assessment
const createPatientStress = async (req, res) => {
  try {
    const { error } = patientStressValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId, responses } = req.body;
    const addedBy = req.user.role;

    // Check if all required question keys are present
    const providedKeys = responses.map((r) => r.questionKey);
    const missingKeys = validQuestionKeys.filter(
      (key) => !providedKeys.includes(key)
    );

    if (missingKeys.length > 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Missing responses for questions: ${missingKeys.join(", ")}`
      );
    }

    // Calculate total score
    const totalScore = calculateStressScore(responses);

    // Determine stress level and recommendation
    const { stressLevel, recommendation } =
      calculateStressLevelAndRecommendation(totalScore);

    // Create new stress assessment
    const newStress = new patientStressModel({
      patientId,
      addedBy,
      questions: responses.map((r) => ({
        questionKey: r.questionKey,
        score: r.response,
      })),
      totalScore,
      stressLevel,
      recommendation,
    });

    const savedStress = await newStress.save();

    return Response.success(
      res,
      savedStress,

      201,
      "Stress assessment created successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Get Latest Stress Assessment
const getLatestStress = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient ID is missing!"
      );
    }

    const stress = await patientStressModel
      .findOne({
        patientId,
      })
      .sort({ createdAt: -1 });

    if (!stress) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No stress assessment found!"
      );
    }

    return Response.success(
      res,
      stress,
      200,
      "Latest stress assessment fetched successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Get Stress Assessments by Date Range
const getAllStressByDateRange = async (req, res) => {
  try {
    const { error } = stressByDateRangeValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId, startDate, endDate } = req.body;

    const data = await patientStressModel
      .find({
        patientId,
        createdAt: {
          $gte: dayjs(new Date(startDate)).startOf("day").toDate(),
          $lte: dayjs(new Date(endDate)).endOf("day").toDate(),
        },
      })
      .sort({ createdAt: -1 });

    return Response.success(
      res,
      data,
      200,
      "Stress assessments fetched successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  createPatientStress,
  getLatestStress,
  getAllStressByDateRange,
};
