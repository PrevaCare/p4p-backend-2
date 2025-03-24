const Address = require("../../../models/common/address.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

const getAddressById = async (req, res) => {
  try {
    const { addressId } = req.body;
    const address = await Address.findById(addressId);
    if (!address) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Address  not found !"
      );
    }

    return Response.success(res, address, 200, AppConstant.SUCCESS);
  } catch (err) {
    return Response.error(res, 500, AppConstant.FAILED, "Address  not found !");
  }
};

module.exports = { getAddressById };
