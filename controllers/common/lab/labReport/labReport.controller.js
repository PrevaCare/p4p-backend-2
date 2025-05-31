const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig");
const User = require("../../../../models/common/user.model");
const LabReport = require("../../../../models/lab/labReport/labReport.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
  labReportValidationSchema,
} = require("../../../../validators/lab/labReport/labReport.validator");
const Lab = require("../../../../models/lab/lab.model");
const LabPackage = require("../../../../models/lab/labPackage.model");

const createlabReport = async (req, res) => {
  try {
    // const { _id } = req.user;
    const labReportFile = req.files.labReportFile[0];
    if (!labReportFile) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "labReportFile is required !"
      );
    }

    const { error } = labReportValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // find whether user has assinged general physician or not
    const user = await User.findById(req.body.user).populate({
      path: "assignedDoctors",
      select: "firstName lastName specialization",
    });
    // console.log(user);
    //
    if (!user.assignedDoctors || user.assignedDoctors.length === 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no doctor assigned to this user !"
      );
    }

    const assignedGeneralPhysicianDoctor = user.assignedDoctors.filter(
      (doctor) => {
        return doctor.specialization === "General Physician";
      }
    );

    if (
      !assignedGeneralPhysicianDoctor ||
      assignedGeneralPhysicianDoctor.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no general physician doctor assigned to this employee !"
      );
    }
    // console.log(assignedGeneralPhysicianDoctor);

    // return;

    // upload to aws -- lab file
    const uploadedLabReportFile = await uploadToS3(labReportFile);
    if (!uploadedLabReportFile) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "lab report failed to upload !"
      );
    }

    const newLabReport = new LabReport({
      ...req.body,
      user: req.body.user,
      doctor: assignedGeneralPhysicianDoctor[0]._id,
      labReportFile: uploadedLabReportFile.Location,
      createdBy: req.body.createdBy,
    });
    const savedLabReport = await newLabReport.save();
    return Response.success(
      res,
      savedLabReport,
      201,
      "Lab report created successfully !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server failed !"
    );
  }
};

const getLabPartners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "labName",
      sortOrder = "desc"
    } = req.query;

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { labName: { $regex: search, $options: "i" } },
            // { labPersonName: { $regex: search, $options: "i" } },
            // { "address.city": { $regex: search, $options: "i" } },
            // { "address.state": { $regex: search, $options: "i" } }
          ]
        }
      : {};

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Lab.countDocuments(searchQuery);

    // Get lab partners with pagination and sorting
    const labPartners = await Lab.find(searchQuery)
      .select('logo labName labPersonName contactNumber address availableCities')
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const cleanedLabPartners = labPartners.map(lab => {
      const cleanedLab = lab.toObject();
    
      if (cleanedLab.address) {
        delete cleanedLab.address._id;
      }
      if (Array.isArray(cleanedLab.availableCities)) {
        cleanedLab.availableCities = cleanedLab.availableCities.map(city => {
          const c = { ...city };
          delete c._id;
          return c;
        });
      }
    
      return cleanedLab;
    });

    return Response.success(
      res,
      {
        labPartners: cleanedLabPartners,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      200,
      "Lab partners retrieved successfully"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const getLabPartnerPackages = async (req, res) => {
  try {
    const { labId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "packageName",
      sortOrder = "asc"
    } = req.query;

    // Verify if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab not found"
      );
    }

    console.log({lab})

    // Build search query
    const searchQuery = {
      labId,
      ...(search ? { packageName: { $regex: search, $options: "i" } } : {})
    };

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await LabPackage.countDocuments(searchQuery);

    // Get packages with pagination and sorting
    const packages = await LabPackage.find(searchQuery)
      .select('logo packageCode packageName desc category testIncluded sampleRequired preparationRequired gender ageGroup cityAvailability -_id')
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return Response.success(
      res,
      {
        labName: lab.labName,
        packages,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      200,
      "Lab partner packages retrieved successfully"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = { createlabReport, getLabPartners, getLabPartnerPackages };
