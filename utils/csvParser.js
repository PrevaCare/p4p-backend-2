const fs = require("fs");
const csv = require("csv-parser");
const multer = require("multer");
const path = require("path");

// Configure storage for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/temp");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".csv");
  },
});

// Filter for CSV files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"), false);
  }
};

// Create multer upload instance
const csvUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Parse CSV file and return array of objects
 * @param {string} filePath - Path to CSV file
 * @param {string[]} requiredFields - Array of required field names
 * @returns {Promise<Array>} - Array of objects representing CSV rows
 */
const parseCSV = (filePath, requiredFields = []) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        // Check if all required fields are present in the CSV
        if (requiredFields.length > 0) {
          const missingFields = requiredFields.filter(
            (field) => !headers.includes(field)
          );
          if (missingFields.length > 0) {
            reject(
              new Error(`Missing required fields: ${missingFields.join(", ")}`)
            );
          }
        }
      })
      .on("data", (data) => results.push(data))
      .on("end", () => {
        if (results.length === 0) {
          reject(new Error("CSV file is empty"));
        } else {
          resolve(results);
        }
      })
      .on("error", (err) => {
        reject(new Error(`Error parsing CSV: ${err.message}`));
      });
  });
};

/**
 * Validate and transform CSV data
 * @param {Array} data - Array of objects from CSV
 * @param {Object} fieldConfig - Configuration for fields with defaults
 * @returns {Array} - Validated and transformed data
 */
const validateAndTransformCSVData = (data, fieldConfig = {}) => {
  return data.map((row, index) => {
    const transformedRow = { ...row };

    // Apply default values for configured fields
    Object.keys(fieldConfig).forEach((field) => {
      if (!transformedRow[field] || transformedRow[field].trim() === "") {
        transformedRow[field] = fieldConfig[field].default;
      }
    });

    // Validate numeric fields
    [
      "Billing Rate",
      "Partner Rate",
      "PrevaCare Price",
      "Discount Price",
      "Home Collection Charges",
    ].forEach((field) => {
      if (transformedRow[field] !== undefined) {
        const numValue = parseFloat(transformedRow[field]);
        if (isNaN(numValue)) {
          throw new Error(`Row ${index + 1}: ${field} must be a number`);
        }
        transformedRow[field] = numValue;
      }
    });

    return transformedRow;
  });
};

/**
 * Process CSV data based on schema definition
 * @param {Array} data - Array of objects from CSV
 * @param {Object} schema - Schema definition with field types and requirements
 * @returns {Object} - Object with validated data and any errors
 */
const processCSVWithSchema = (data, schema) => {
  const errors = [];
  const processedData = [];

  data.forEach((row, rowIndex) => {
    const processedRow = {};
    let rowValid = true;

    // Process each field according to schema
    Object.keys(schema).forEach((field) => {
      const fieldSchema = schema[field];
      const value = row[field];

      // Check required fields
      if (fieldSchema.required && (!value || value.trim() === "")) {
        errors.push(`Row ${rowIndex + 1}: ${field} is required`);
        rowValid = false;
        return;
      }

      // Use default value if field is empty
      if (
        (!value || value.trim() === "") &&
        fieldSchema.default !== undefined
      ) {
        processedRow[field] = fieldSchema.default;
        return;
      }

      // Type conversion based on schema
      if (value !== undefined && value !== "") {
        switch (fieldSchema.type) {
          case "number":
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              errors.push(`Row ${rowIndex + 1}: ${field} must be a number`);
              rowValid = false;
            } else {
              processedRow[field] = numValue;
            }
            break;
          case "boolean":
            processedRow[field] = value.toLowerCase() === "true";
            break;
          default: // string
            processedRow[field] = value;
        }
      }
    });

    if (rowValid) {
      processedData.push(processedRow);
    }
  });

  return {
    data: processedData,
    errors: errors.length > 0 ? errors : null,
  };
};

module.exports = {
  csvUpload,
  parseCSV,
  validateAndTransformCSVData,
  processCSVWithSchema,
};
