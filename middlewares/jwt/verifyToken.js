const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../../models/common/user.model");
dotenv.config();

// Middleware to verify tokens and roles
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // console.log(authHeader);
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_TOKEN_SEC, (err, user) => {
      if (err) {
        return res.status(403).json("Token validation failed!");
      }

      req.user = user;
      next();
    });
  } else {
    return res.status(401).json("You are not authenticated!");
  }
};
const verifyAndAuthoriseToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // console.log("header get");
  // console.log(authHeader);
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_TOKEN_SEC, async (err, user) => {
      if (err) {
        return res.status(403).json("Token validation failed!");
      }
      const existingUser = await User.findById(user._id);
      // console.log(existingUser);
      // console.log(user.accessToken);
      // console.log(existingUser.accessToken.includes(token));
      if (!existingUser || !existingUser.accessToken.includes(token)) {
        // console.log("if block");
        return res
          .status(403)
          .json("You are not allowed to perform this operation !");
      }
      req.user = user;
      next();
    });
  } else {
    // console.log("token not found ! verify and auth !");
    return res.status(401).json("You are not authenticated!");
  }
};

const verifyRole = (roles) => {
  return (req, res, next) => {
    verifyToken(req, res, () => {
      // console.log(req.user.role);
      if (roles.includes(req.user.role)) {
        next();
      } else {
        return res
          .status(403)
          .json("You do not have permission to perform this action!");
      }
    });
  };
};
const verifyAndAuthorizeRole = (roles) => {
  return (req, res, next) => {
    verifyAndAuthoriseToken(req, res, () => {
      if (roles.includes(req.user.role)) {
        next();
      } else {
        return res
          .status(403)
          .json("You do not have permission to perform this action!");
      }
    });
  };
};

// Export all functions and middleware
module.exports = {
  verifyToken,
  verifyAndAuthoriseToken,
  verifyRole, // Generalized role verification
  // verifyAndAuthorize: verifyRole(["user", "Admin", "superadmin"]), // Adjusted to include all user types
  verifyAndDoctor: verifyRole(["Superadmin", "Admin", "Doctor"]), // Admins and super admins can perform admin tasks
  verifySuperAdmin: verifyRole(["Superadmin"]), // Admins and super admins can perform admin tasks
  verifyAndSuperAdmin: verifyAndAuthorizeRole(["Superadmin"]), // Only super admins
};
