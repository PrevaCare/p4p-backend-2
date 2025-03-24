const mongoose = require("mongoose");

// base schema
const UserSchema = mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "email is required !"],
    },
    password: {
      type: String,
      trim: true,
      required: [true, "password is required !"],
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "phone is required !"],
    },
    role: {
      type: String,
      enum: [
        "Superadmin",
        "Admin",
        "Doctor",
        "School",
        "Corporate",
        "Institute",
        "Employee",
        "IndividualUser",
      ],
      required: [true, "role is required !"],
    },
    accessToken: {
      type: [String],
      default: [],
      //   required: true,
    },
    refreshToken: {
      type: [String],
      default: [],
      //   required: true,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "role",
  }
);

module.exports = mongoose.model("User", UserSchema);
