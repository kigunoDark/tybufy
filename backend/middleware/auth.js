const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: "User not found or account deactivated",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

const checkUsageLimits = (featureType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const now = new Date();
      const lastReset = new Date(user.usage.lastReset);
      if (
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()
      ) {
        user.usage.scriptsGenerated = 0;
        user.usage.audioGenerated = 0;
        user.usage.thumbnailsGenerated = 0;
        user.usage.lastReset = now;
        await user.save();
      }

      if (user.subscription !== "free" && !user.isSubscriptionActive()) {
        return res.status(403).json({
          success: false,
          error: "Subscription expired or inactive",
          needsUpgrade: true,
        });
      }

      let amount = 1;
      if (featureType === "audioGenerated" && req.body.text) {
        amount = req.body.text.length;
      }

      if (!user.canUseFeature(featureType, amount)) {
        const limits = user.getLimits();
        return res.status(429).json({
          success: false,
          error: `${featureType} limit exceeded`,
          usage: user.usage,
          limits: limits,
          needsUpgrade: true,
          currentPlan: user.subscription,
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Usage check error:", error);
      res.status(500).json({
        success: false,
        error: "Error checking usage limits",
      });
    }
  };
};

module.exports = {
  authenticateToken,
  checkUsageLimits,
};
