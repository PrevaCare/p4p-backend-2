const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      required: [true, "City name is required"],
      trim: true,
      // unique: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    pincode: {
      type: String,
      default: "",
      trim: true,
    },
    pinCodes_excluded: {
      type: [String],
      default: [],
    },
    regions_excluded: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const normalise = (doc) => {
  if (doc.cityName) doc.cityName = doc.cityName.toLowerCase().trim();
  if (doc.state) doc.state = doc.state.toLowerCase().trim();
  return doc;
};

citySchema.pre("save", function (next) {
  normalise(this);
  next();
});

citySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.$set) normalise(update.$set);
  next();
});

citySchema.index(
  { cityName: 1, state: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("City", citySchema);
