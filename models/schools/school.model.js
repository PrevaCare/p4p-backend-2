const mongoose = require("mongoose");
const User = require("../common/user.model");

const defaultClasses = [
  { className: "I", sections: ["A", "B", "C", "D"] },
  { className: "II", sections: ["A", "B", "C", "D"] },
  { className: "III", sections: ["A", "B", "C", "D"] },
  { className: "IV", sections: ["A", "B", "C", "D"] },
  { className: "V", sections: ["A", "B", "C", "D"] },
  { className: "VI", sections: ["A", "B", "C", "D"] },
  { className: "VII", sections: ["A", "B", "C", "D"] },
  { className: "VIII", sections: ["A", "B", "C", "D"] },
  { className: "IX", sections: ["A", "B", "C", "D"] },
  { className: "X", sections: ["A", "B", "C", "D"] },
];

const SchoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
    },
    logo: { type: String },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
    department: { type: String, required: true },
    designation: { type: String, required: true },
    classes: {
      type: [
        {
          className: {
            type: String,
            enum: [
              "I",
              "II",
              "III",
              "IV",
              "V",
              "VI",
              "VII",
              "VIII",
              "IX",
              "X",
              "XI",
              "XII",
            ],
          },
          sections: {
            type: [String],
            enum: ["A", "B", "C", "D"],
          },
        },
      ],
      default: defaultClasses,
    },
    assignedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true }
);

// Pre-save middleware to set default classes and sections if not provided
SchoolSchema.pre("save", function (next) {
  if (!this.classes || this.classes.length === 0) {
    this.classes = defaultClasses;
  } else {
    this.classes.forEach((cls) => {
      if (!cls.sections || cls.sections.length === 0) {
        cls.sections = ["A", "B", "C", "D"];
      }
    });
  }
  next();
});

const School = User.discriminator("School", SchoolSchema);
module.exports = School;
