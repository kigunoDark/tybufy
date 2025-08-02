const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  thumbnailLimiter,
  trackThumbnailUsage,
} = require("../middleware/rateLimiters");
const upload = require("../middleware/upload");
const {
  clearRateLimit,
  generateThumbnailsHandler,
  analyzeImage,
  getStats,
  processObjects,
  getStatus,
} = require("../controllers/thumbnailController");

const router = express.Router();

// Debug middleware for thumbnails
router.use((req, res, next) => {
  if (req.path.includes("/thumbnails/")) {
    console.log("📋 Content-Type:", req.get("Content-Type"));
    console.log("📦 Body present:", !!req.body);
    console.log("📦 Body keys:", req.body ? Object.keys(req.body) : "none");
  }
  next();
});

router.post("/clear-rate-limit", authenticateToken, clearRateLimit);
router.post(
  "/generate",
  authenticateToken,
  thumbnailLimiter,
  trackThumbnailUsage,
  generateThumbnailsHandler
);
router.post(
  "/analyze-image",
  authenticateToken,
  upload.single("image"),
  analyzeImage
);
router.get("/stats", authenticateToken, getStats);
router.post(
  "/process-objects",
  authenticateToken,
  upload.array("objects", 3),
  processObjects
);
router.get("/status", authenticateToken, getStatus);

module.exports = router;
