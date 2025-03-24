const Address = require("../../../models/common/address.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

const updateAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { $set: req.body },
      { new: true }
    );
    if (!updatedAddress) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Address  not updated !"
      );
    }

    return Response.success(res, updatedAddress, 200, AppConstant.SUCCESS);
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Internal server error !"
    );
  }
};

module.exports = { updateAddressById };
