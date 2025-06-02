const jwt = require("jsonwebtoken");
const User = require("../../models/common/user.model");
const Role = require("../../models/role.model");
const Permission = require("../../models/permission.model");

module.exports = {
  verifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;

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
  },

  checkPermissions: (action, resource) => async (req, res, next) => {
    try {
      const user = await User.findById(req.user?._id);
      // console.log(req.user);
      if (!user) return res.status(404).send("User not found");

      const roles = await Role.findOne({ name: user.role }).populate({
        path: "permissions",
      });

      //   console.log(roles);
      //   return;
      if (!roles)
        return res.status(404).send("roles not found related to user !");

      const rolePermissions = roles.permissions;
      // console.log(rolePermissions);

      // Log all permissions for the user
      console.log("User Permissions:", {
        userId: user._id,
        role: user.role,
        permissions: rolePermissions.map((permission) => ({
          resource: permission.resource,
          actions: permission.actions,
        })),
      });

      const hasPermission = rolePermissions.some((permission) => {
        return (
          permission.actions.get(resource) &&
          permission.actions.get(resource).includes(action)
        );
      });

      if (!hasPermission) return res.status(403).send("Permission Denied");
      next();
    } catch (err) {
      console.log(err);
      res.status(500).send(err.message || "Internal Server Error");
    }
  },

  verifyTokenOptional: (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, proceed as unauthenticated user
      req.user = null;
      return next();
    }

    // Extract token
    const token = authHeader.split(" ")[1];
    if (!token) {
      // No token after Bearer, proceed as unauthenticated user
      req.user = null;
      return next();
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_TOKEN_SEC);
      req.user = decoded;
      next();
    } catch (err) {
      // Token is invalid, proceed as unauthenticated user
      req.user = null;
      next();
    }
  },
};
