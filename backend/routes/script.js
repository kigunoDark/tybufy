const express = require("express");
const { authenticateToken, checkUsageLimits } = require("../middleware/auth");
const {
  getKeyPoints,
  generateScriptHandler,
  improveScript,
  getQuality,
  extendScriptHandler,
} = require("../controllers/scriptController");

const router = express.Router();

router.post("/key-points", authenticateToken, getKeyPoints);
router.post(
  "/generate",
  authenticateToken,
  checkUsageLimits("scriptsGenerated"),
  generateScriptHandler
);
router.post("/improve", authenticateToken, improveScript);
router.post("/quality", authenticateToken, getQuality);
router.post("/extend", authenticateToken, extendScriptHandler);

module.exports = router;
