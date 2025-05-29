const Permission = require("../models/permission.model");
const Role = require("../models/role.model");
const Response = require("../utils/Response");
const createPermissionsAndRoles = async (req, res) => {
  const { permission, role } = req.body;
  const newPermission = new Permission({
    name: permission.name,
    actions: permission.actions,
  });
  const savedPermission = await newPermission.save();

  const newRole = new Role({
    name: role.name,
    permissions: [savedPermission._id],
  });
  const savedRole = await newRole.save();

  return Response.success(
    res,
    { savedRole, savedPermission },
    201,
    "User registered successfully !"
  );
};

module.exports = { createPermissionsAndRoles };
