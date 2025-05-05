const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");

// Middleware to ensure patient can only access their own data
const checkPatientSelfAccess = async (req, res, next) => {
  try {
    // Get the authenticated user ID from the token
    const authenticatedUserId = req.user._id;

    // Get the requested patient/employee ID from query parameters or request body
    const requestedUserId =
      req.query.employeeId ||
      req.query.patientId ||
      req.body.employeeId ||
      req.body.patientId ||
      req.body.user;

    if (!requestedUserId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient or employee ID is missing in the request"
      );
    }

    // Check if the authenticated user is the same as the requested user
    if (authenticatedUserId.toString() !== requestedUserId.toString()) {
      return Response.error(
        res,
        403,
        AppConstant.FAILED,
        "Access denied. You can only access your own health data."
      );
    }

    // If the user is accessing their own data, proceed
    next();
  } catch (error) {
    console.error("Patient self-access check error:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error!"
    );
  }
};

module.exports = { checkPatientSelfAccess };
