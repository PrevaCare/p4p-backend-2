const mongoose = require("mongoose");
const EMR = require("../common/emr.model");

const AdultMaleEMRSchema = new mongoose.Schema({
  // No additional fields specific to males
});

const AdultMaleEMR = EMR.discriminator("M", AdultMaleEMRSchema);

module.exports = AdultMaleEMR;
