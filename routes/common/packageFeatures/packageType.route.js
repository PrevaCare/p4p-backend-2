const express = require("express");
const router = express.Router();
const packageTypeController = require("../../../controllers/common/packageFeatures/packageType.controller");
const packageTypeValidator = require("../../../validators/packageType.validator");

// Type routes
router.get("/", packageTypeController.getAllTypesBasic);
router.get("/with-subtypes", packageTypeController.getAllTypes);
router.get("/:typeId", packageTypeController.getTypeById);
router.post(
  "/",
  packageTypeValidator.createTypeValidator,
  packageTypeController.createType
);
router.put(
  "/:typeId",
  packageTypeValidator.updateTypeValidator,
  packageTypeController.updateType
);
router.delete("/:typeId", packageTypeController.deleteType);

// Subtype routes
router.post(
  "/:typeId/subtypes",
  packageTypeValidator.addSubtypeValidator,
  packageTypeController.addSubtype
);
router.put(
  "/:typeId/subtypes/:subtypeId",
  packageTypeValidator.updateSubtypeValidator,
  packageTypeController.updateSubtype
);
router.delete(
  "/:typeId/subtypes/:subtypeId",
  packageTypeController.removeSubtype
);

module.exports = router;
