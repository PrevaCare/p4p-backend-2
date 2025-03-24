const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  // signatureVersion: "v4",
});

const uploadToS3 = (file) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: "public-read",
  };

  return s3.upload(params).promise();
};

//

// using disk storage for larger file size
const uploadToS3DisckStorage = (filePath, file) => {
  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${Date.now()}_${file.originalname}`,
    Body: fileStream,
    ContentType: file.mimetype,
    // ACL: "public-read",
  };

  return s3.upload(params).promise();
};

// Function to delete file from S3
const deleteS3Object = async (fileUrl) => {
  try {
    const urlParts = fileUrl.split("/");
    const fileName = urlParts[urlParts.length - 1]; // Extract the filename/key from the URL

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
    };

    await s3.deleteObject(params).promise();
    console.log(`File ${fileName} deleted successfully from S3`);
  } catch (error) {
    console.error(`Failed to delete file from S3: ${error.message}`);
  }
};

const handleFileUpload = async (file) => {
  try {
    // Step 1: Validate if the file exists
    // console.log("yes hitted");
    // console.log(file);
    if (!file) {
      throw new Error("No file uploaded");
    }
    // Get the current file's directory using __dirname
    const filePath = path.join(
      __dirname,
      "../../public",
      "temp",
      file.filename
    );
    // console.log(filePath);
    // console.log(file.filename);
    // console.log(file);
    // Step 2: Upload the file to S3
    const s3UploadResult = await uploadToS3DisckStorage(filePath, file);

    // Step 3: Unlink (delete) the local file after successful upload
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file from local storage:", err);
      }
    });

    // Return the S3 URL
    return s3UploadResult.Location;
  } catch (error) {
    throw new Error(`File upload error: ${error.message}`);
  }
};

module.exports = { uploadToS3, handleFileUpload, deleteS3Object };
