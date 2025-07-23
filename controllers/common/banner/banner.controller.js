const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig.js");
const Banner = require("../../../models/common/banner/banner.model");

const createBanner = async (req, res) => {
  try {
    const { displayOrder, type, subtype, doctorId, partnerId, packageId, haveCTA = true, isActive = true } = req.body;

    let bannerImage = "";

    if (req.files && req.files.image && req.files.image.length > 0) {
      const bannerImageToUpload = req.files.image[0];
      const bannerImageUploaded = await uploadToS3(bannerImageToUpload);
      bannerImage = bannerImageUploaded.Location;
    }

    if (!bannerImage) {
        return res.status(400).json({ message: 'Banner image is required!'})
    }

    // Create new banner object with CTA-related fields
    const newBanner = new Banner({
      image: bannerImage,
      displayOrder,
      type,
      subtype,
      doctorId,    // Only used for 'doctor-appointment' and 'tele-consultation'
      partnerId,   // Only used for 'lab-test'
      packageId,   // Only used for 'package'
      haveCTA,
      isActive
    });

    // Save the banner to the database
    await newBanner.save();
    return res.status(201).json({ message: "Banner created successfully", banner: newBanner });
  } catch (err) {
    console.error("Error creating banner:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getBanners = async (req, res) => {
    try {
      const { type, subtype, page = 1, limit = 50 } = req.query;
  
      // Build the filter object based on query parameters
      const filters = { isActive: true };
      if (type) filters.type = type;
      if (subtype) filters.subtype = subtype;
  
      const banners = await Banner.find(filters)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ displayOrder: 1 }); // Sort by displayOrder to keep the correct sequence
  
      const totalBanners = await Banner.countDocuments(filters);
  
      return res.status(200).json({
        data: banners,
        total: totalBanners,
        page,
        limit,
      });
    } catch (err) {
      console.error("Error fetching banners:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  
  const updateBanner = async (req, res) => {
    try {
      const { bannerId } = req.params;
      const {
        displayOrder,
        type,
        subtype,
        doctorId,
        partnerId,
        packageId,
        haveCTA,
        isActive
      } = req.body;

      let bannerImage = "";

      if (req.files && req.files.image && req.files.image.length > 0) {
        const bannerImageToUpload = req.files.image[0];
        const bannerImageUploaded = await uploadToS3(bannerImageToUpload);
        bannerImage = bannerImageUploaded.Location;
      }
  
      // Create an object with only the fields that were provided in the request body
      const updateData = {};
  
      if (bannerImage) updateData.image = bannerImage;
      if (displayOrder) updateData.displayOrder = displayOrder;
      if (type) updateData.type = type;
      if (subtype) updateData.subtype = subtype;
      if (doctorId) updateData.doctorId = doctorId;  // Only used for 'doctor-appointment' and 'tele-consultation'
      if (partnerId) updateData.partnerId = partnerId;  // Only used for 'lab-test'
      if (packageId) updateData.packageId = packageId;  // Only used for 'package'
      if (haveCTA !== undefined) updateData.haveCTA = haveCTA;
      if (isActive !== undefined) updateData.isActive = isActive;
  
      // Perform the update operation with the fields that are provided
      const updatedBanner = await Banner.findByIdAndUpdate(bannerId, updateData, { new: true });
  
      if (!updatedBanner) {
        return res.status(404).json({ message: "Banner not found" });
      }
  
      return res.status(200).json({ message: "Banner updated successfully", banner: updatedBanner });
    } catch (err) {
      console.error("Error updating banner:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  };  

  const deleteBanner = async (req, res) => {
    try {
      const { bannerId } = req.params;
  
      const deletedBanner = await Banner.findByIdAndDelete(bannerId);
  
      if (!deletedBanner) {
        return res.status(404).json({ message: "Banner not found" });
      }
  
      return res.status(200).json({ message: "Banner deleted successfully" });
    } catch (err) {
      console.error("Error deleting banner:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
};

const updateOrder = async (req, res, next) => {
  const { banners } = req.body;

  if (!banners || !Array.isArray(banners)) {
    return next(new AppError("Banners array is required", 400));
  }

  const updatePromises = banners.map((banner, index) => {
    return Banner.findByIdAndUpdate(
      banner._id,
      { displayOrder: index + 1 },
      { new: true, runValidators: true }
    );
  });

  const updatedBanners = await Promise.all(updatePromises);

  res.status(200).json({
    status: "success",
    data: {
      banners: updatedBanners,
    },
  });
}


module.exports = {
    createBanner,
    getBanners,
    updateBanner,
    deleteBanner,
    updateOrder,
}
