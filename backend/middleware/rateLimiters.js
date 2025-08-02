const rateLimit = require("express-rate-limit");
const User = require("../models/User");

const thumbnailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 50,
  message: {
    success: false,
    error: "Too many thumbnail generation requests, please wait a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req) => {
    return process.env.NODE_ENV === "development" && req.ip === "::1";
  },
});

const trackThumbnailUsage = async (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
      return next();
    }

    if (!req.body) {
      return next();
    }

    const user = await User.findById(req.user._id);

    const limits = {
      free: { thumbnailsGenerated: 100000000 },
      pro: { thumbnailsGenerated: 500000000 },
      premium: { thumbnailsGenerated: -1 },
    };

    const userLimits = limits[user.subscription];
    if (
      userLimits.thumbnailsGenerated !== -1 &&
      (user.usage.thumbnailsGenerated || 0) >= userLimits.thumbnailsGenerated
    ) {
      return res.status(429).json({
        success: false,
        error: `Monthly thumbnail generation limit reached. Upgrade your subscription for more.`,
        usage: user.usage,
        limits: userLimits,
      });
    }

    req.userLimits = userLimits;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  thumbnailLimiter,
  trackThumbnailUsage,
};
