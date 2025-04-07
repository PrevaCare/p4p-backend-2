const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");
const Lab = require("../../../models/lab/lab.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const {
  labValidationSchema,
  updateLabValidationSchema,
} = require("../../../validators/lab/lab.validator");

const createLab = async (req, res) => {
  try {
    const logo = req.files.logo[0];
    if (!logo) {
      return Response.error(res, 404, AppConstant.FAILED, "logo is required !");
    }
    const { error } = labValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }
    // upload to aws -- lab logo
    const uploadedLogo = await uploadToS3(logo);
    if (!uploadedLogo) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "logo failed to upload !"
      );
    }

    const newLab = new Lab({
      ...req.body,
      logo: uploadedLogo.Location,
    });
    const savedLab = await newLab.save();
    return Response.success(res, savedLab, 201, "Lab created successfully !");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server failed !"
    );
  }
};

// update -- lab
const updateLab = async (req, res) => {
  try {
    const { labId } = req.params;
    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "labId is missing !");
    }

    // body validation
    const { error } = updateLabValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // logo if present update
    let logo = "";
    if (req.files && req.files.logo && req.files.logo.length > 0) {
      const logoToUpload = req.files.logo[0];
      const logoUploaded = await uploadToS3(logoToUpload);

      if (!logoUploaded) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "logo failed to upload !"
        );
      }
      logo = logoUploaded.Location;
    }

    const updatedLab = logo
      ? await Lab.findByIdAndUpdate(
          labId,
          { $set: { ...req.body, logo } },
          { new: true }
        )
      : await Lab.findByIdAndUpdate(labId, { $set: req.body }, { new: true });

    return Response.success(res, updatedLab, 200, "Lab updated successfully !");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server failed !"
    );
  }
};

// get all labs
const getAllLabs = async (req, res) => {
  try {
    const exisitingAllLabs = await Lab.find({});
    return Response.success(
      res,
      exisitingAllLabs,
      200,
      "all labs found successfully!"
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
// get single lab by id
const getLabById = async (req, res) => {
  try {
    const { labId } = req.body;
    if (!labId) {
      return Response.error(res, 404, AppConstant.FAILED, "labId is missing !");
    }

    const existingLab = await Lab.findOne({ _id: labId });
    if (!existingLab) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "lab not found with given labId !"
      );
    }
    return Response.success(res, existingLab, 200, "lab found with id !");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const getLabsByLocation=async (req,res)=>{
  try {
    const { city, zipCode } = req.body;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City name is required"
      });
    }

    // Using aggregation to match labs with the specified city and optional zipcode
    const pipeline = [
      {
        $match: {
          cityOperatedIn: {
            $elemMatch: {
              cityName: { $regex: new RegExp(city, 'i') },
              ...(zipCode && { zipCode: zipCode })
            }
          }
        }
      }
    ];

    const labs = await Lab.aggregate(pipeline);

    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: zipCode
          ? `No labs found in ${city} with zipCode ${zipCode}`
          : `No labs found in ${city}`
      });
    }

    return res.status(200).json({
      success: true,
      count: labs.length,
      data: labs
    });
  } catch (error) {
    console.error("Error fetching labs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}


//

module.exports = { createLab, getAllLabs, getLabById, updateLab ,getLabsByLocation};
