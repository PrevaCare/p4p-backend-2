const jwt = require("jsonwebtoken");
const User = require("../../models/common/user.model");

const checkRoleAccess = (allowedRoles) => async (req, res, next) => {
  try {
    // Get user from the request (should be set by verifyToken middleware)
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user's role is in the allowed roles array
    if (allowedRoles.includes(user.role)) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Access denied. Role not authorized." });
    }
  } catch (error) {
    console.error("Role access check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { checkRoleAccess };
