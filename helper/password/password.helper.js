const CryptoJS = require("crypto-js");

const encryptPasswordFn = (plainPassword) => {
  const encryptedPassword = plainPassword
    ? CryptoJS.AES.encrypt(plainPassword, process.env.AES_SEC).toString()
    : null;

  return encryptedPassword;
};
const validGender = (gender) => {
  const validGender = gender ? gender.toLowerCase() : null;
  if (validGender === "male") {
    return "M";
  } else if (validGender === "female") {
    return "F";
  } else return null;
};
const validIsMarried = (isMarried) => {
  const validIsMarried = isMarried ? isMarried.toLowerCase() : null;
  if (validIsMarried === "yes") {
    return true;
  } else return false;
};

module.exports = { encryptPasswordFn, validGender, validIsMarried };
