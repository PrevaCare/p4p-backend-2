const multer = require("multer");
const path = require("path");

const imageFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// Configure storage
const storage = multer.memoryStorage();

// Create multer upload instance for images
const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// PDF specific upload configuration
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const pdfUpload = multer({
  storage: storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size for PDFs
  },
});

// New multer instance for any file format
const anyFileUpload = multer({
  storage: storage, // You can change this to diskStorage if needed
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size for any file
  },
});

module.exports = { upload, pdfUpload, anyFileUpload };

// const tempUploadDir = path.join(__dirname, "../../public", "tempUpload");
// const upload = multer({ storage: storage });

// const storage = multer.diskStorage();

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     console.log(tempUploadDir);

//     cb(null, tempUploadDir);
//   },
//   //   filename: (req, file, cb) => {
//   //     cb(null, file.originalname);
//   //   },
//   filedata: (req, file, cb) => {
//     cb(null, file);
//   },
// });
