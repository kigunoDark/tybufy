const express = require("express");
const { authenticateToken, checkUsageLimits } = require("../middleware/auth");
const {
  getVoices,
  generateAudioHandler,
} = require("../controllers/audioController");

const router = express.Router();

router.get("/voices", authenticateToken, getVoices);
router.post(
  "/generate",
  authenticateToken,
  checkUsageLimits("audioGenerated"),
  generateAudioHandler
);

module.exports = router;
