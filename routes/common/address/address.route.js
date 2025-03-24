const {
  getAddressById,
} = require("../../../controllers/common/address/getAddress.controller");
const {
  updateAddressById,
} = require("../../../controllers/common/address/updateAddress.controller");

const router = require("express").Router();

router.post("/admin/address", getAddressById);
router.patch("/admin/address/:addressId", updateAddressById);

module.exports = router;
