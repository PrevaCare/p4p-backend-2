const rateLimit = require("express-rate-limit");

// Rate limit for search operations (20 requests per minute)
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    status: 429,
    success: false,
    message: "Too many search requests, please try again after 1 minute",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limit for data retrieval operations (30 requests per minute)
const retrievalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    status: 429,
    success: false,
    message: "Too many retrieval requests, please try again after 1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for data modification operations (10 requests per minute)
const modificationRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    status: 429,
    success: false,
    message: "Too many modification requests, please try again after 1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for upload operations (5 requests per 5 minutes)
const uploadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests per 5 minutes
  message: {
    status: 429,
    success: false,
    message: "Too many upload requests, please try again after 5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  searchRateLimit,
  retrievalRateLimit,
  modificationRateLimit,
  uploadRateLimit,
};
