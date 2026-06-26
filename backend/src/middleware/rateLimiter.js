const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many AI requests. Wait 15 minutes.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests. Please wait.' }
});

module.exports = { aiLimiter, apiLimiter };
