const momentTimeZone = require("moment-timezone");

const dayjs = require("dayjs");
const convertToIST = (date) => {
  return momentTimeZone(date).tz("Asia/Kolkata").format("DD-MM-YYYY");
};
const convertToDDMMMYYYY = (date) => {
  return momentTimeZone(date).tz("Asia/Kolkata").format("DD MMM YYYY");
};
const convertToISTOnlyTime = (date) => {
  return momentTimeZone(date).tz("Asia/Kolkata").format("hh:mm A");
};

const getCurrentMonthDates = () => {
  const startDate = dayjs().startOf("month").format("YYYY-MM-DD");
  const endDate = dayjs().endOf("month").format("YYYY-MM-DD");

  return { startDate, endDate };
};

module.exports = {
  convertToIST,
  convertToDDMMMYYYY,
  convertToISTOnlyTime,
  getCurrentMonthDates,
};
