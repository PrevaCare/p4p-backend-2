const rateLimit = require("express-rate-limit");

const rateLimitOneCallInTenSeconds = rateLimit({
  windowMs: 10 * 1000, // 30 seconds
  max: 1, // Limit each IP to 1 request per `windowMs`
  message: {
    status: 429,
    success: false,
    message: "Too many requests, please try again after 30 seconds",
  },
});

module.exports = { rateLimitOneCallInTenSeconds };
