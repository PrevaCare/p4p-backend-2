const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadToS3 = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error("Invalid file object. File buffer is required.");
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();
    return result;
  } catch (error) {
    console.error("Error in uploadToS3:", error);
    throw error;
  }
};

//

// using disk storage for larger file size
const uploadToS3DiskStorage = async (filePath, file) => {
  try {
    if (!filePath || !file) {
      throw new Error("File path and file object are required");
    }

    const fileStream = fs.createReadStream(filePath);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${Date.now()}-${file.originalname}`,
      Body: fileStream,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();
    return result;
  } catch (error) {
    console.error("Error in uploadToS3DiskStorage:", error);
    throw error;
  }
};

// Function to delete file from S3
const deleteS3Object = async (fileUrl) => {
  try {
    if (!fileUrl) {
      throw new Error("File URL is required");
    }

    const urlParts = fileUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
    };

    await s3.deleteObject(params).promise();
    console.log(`File ${fileName} deleted successfully from S3`);
    return true;
  } catch (error) {
    console.error(`Failed to delete file from S3:`, error);
    throw error;
  }
};

const handleFileUpload = async (file) => {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    // For memory storage uploads
    if (file.buffer) {
      const result = await uploadToS3(file);
      return result.Location;
    }

    // For disk storage uploads
    const filePath = path.join(__dirname, "../../public/temp", file.filename);
    const result = await uploadToS3DiskStorage(filePath, file);

    // Clean up local file
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.error("Error deleting local file:", unlinkError);
      // Continue even if local file deletion fails
    }

    return result.Location;
  } catch (error) {
    console.error("Error in handleFileUpload:", error);
    throw error;
  }
};

module.exports = { uploadToS3, handleFileUpload, deleteS3Object };
