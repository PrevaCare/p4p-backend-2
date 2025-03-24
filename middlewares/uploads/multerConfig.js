const multer = require("multer");

//
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pdfUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = { upload, pdfUpload };

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
