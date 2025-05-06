const patientDepressionModel = require("../../../../models/patient/healthTracker/depression/patientDepression.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const dayjs = require("dayjs");
const {
  patientDepressionValidationSchema,
  depressionByDateRangeValidationSchema,
  validQuestionKeys,
} = require("../../../../validators/patient/healthTracker/patientDepression.validator");
const {
  depressionLevelInterpretation,
  selfHarmRiskMessage,
} = require("./phq9Questions.helper");

// Calculate depression level and recommendation based on total score
const calculateDepressionLevelAndRecommendation = (totalScore) => {
  let depressionLevel, recommendation;

  if (totalScore >= 0 && totalScore <= 4) {
    depressionLevel = "Minimal";
    recommendation = depressionLevelInterpretation.Minimal.recommendation;
  } else if (totalScore >= 5 && totalScore <= 9) {
    depressionLevel = "Mild";
    recommendation = depressionLevelInterpretation.Mild.recommendation;
  } else if (totalScore >= 10 && totalScore <= 14) {
    depressionLevel = "Moderate";
    recommendation = depressionLevelInterpretation.Moderate.recommendation;
  } else if (totalScore >= 15 && totalScore <= 19) {
    depressionLevel = "ModeratelySevere";
    recommendation =
      depressionLevelInterpretation.ModeratelySevere.recommendation;
  } else {
    depressionLevel = "Severe";
    recommendation = depressionLevelInterpretation.Severe.recommendation;
  }

  return { depressionLevel, recommendation };
};

// Calculate the total depression score
const calculateDepressionScore = (responses) => {
  let totalScore = 0;

  responses.forEach((response) => {
    totalScore += response.response;
  });

  return totalScore;
};

// Check if the patient has self-harm risk
const checkSelfHarmRisk = (responses) => {
  const selfHarmQuestion = responses.find(
    (response) => response.questionKey === "selfHarmThoughts"
  );
  return selfHarmQuestion && selfHarmQuestion.response > 0;
};

// Create Depression Assessment
const createPatientDepression = async (req, res) => {
  try {
    const { error } = patientDepressionValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId, responses } = req.body;

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
    const totalScore = calculateDepressionScore(responses);

    // Determine depression level and recommendation
    const { depressionLevel, recommendation } =
      calculateDepressionLevelAndRecommendation(totalScore);

    // Check for self-harm risk
    const selfHarmRisk = checkSelfHarmRisk(responses);

    // Append warning for self-harm risk to recommendation if present
    let finalRecommendation = recommendation;
    if (selfHarmRisk) {
      finalRecommendation = `${recommendation} ${selfHarmRiskMessage}`;
    }

    // Create new depression assessment
    const newDepression = new patientDepressionModel({
      patientId,
      questions: responses.map((r) => ({
        questionKey: r.questionKey,
        score: r.response,
      })),
      totalScore,
      depressionLevel,
      recommendation: finalRecommendation,
      selfHarmRisk,
    });

    const savedDepression = await newDepression.save();

    return Response.success(
      res,
      savedDepression,
      201,
      "Depression assessment created successfully!"
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

// Get Latest Depression Assessment
const getLatestDepression = async (req, res) => {
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

    const depression = await patientDepressionModel
      .findOne({
        patientId,
      })
      .sort({ createdAt: -1 });

    if (!depression) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No depression assessment found!"
      );
    }

    return Response.success(
      res,
      depression,
      200,
      "Latest depression assessment fetched successfully!"
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

// Get Depression Assessments by Date Range
const getAllDepressionByDateRange = async (req, res) => {
  try {
    const { error } = depressionByDateRangeValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId, startDate, endDate } = req.body;

    const data = await patientDepressionModel
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
      "Depression assessments fetched successfully!"
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
  createPatientDepression,
  getLatestDepression,
  getAllDepressionByDateRange,
};
