const mongoose = require("mongoose");

const doctorBankDetailSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    accountHolderName: {
      type: String,
      required: [true, "Account holder name is required"],
      trim: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      trim: true,
      unique: true,
    },
    ifscCode: {
      type: String,
      required: [true, "IFSC code is required"],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Please enter a valid IFSC code"],
    },
    branchName: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
    },
    accountType: {
      type: String,
      required: [true, "Account type is required"],
      enum: ["Savings", "Current"],
      default: "Savings",
    },
    panNumber: {
      type: String,
      required: [true, "PAN number is required"],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Please enter a valid PAN number"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
doctorBankDetailSchema.index({ doctor: 1, accountNumber: 1 });

// Pre-save middleware to format IFSC code and PAN number
doctorBankDetailSchema.pre("save", function (next) {
  if (this.ifscCode) {
    this.ifscCode = this.ifscCode.toUpperCase();
  }
  if (this.panNumber) {
    this.panNumber = this.panNumber.toUpperCase();
  }
  next();
});

// Virtual for masking sensitive information
doctorBankDetailSchema.virtual("maskedAccountNumber").get(function () {
  return "XXXX" + this.accountNumber.slice(-4);
});

const DoctorBankDetail = mongoose.model(
  "DoctorBankDetail",
  doctorBankDetailSchema
);

module.exports = DoctorBankDetail;
