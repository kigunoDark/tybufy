const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  getPlans,
  createCheckoutSession,
  cancelSubscription,
  getSession,
  getSubscription,
} = require("../controllers/paymentsController");

const router = express.Router();

router.get("/plans", getPlans);
router.post(
  "/create-checkout-session",
  authenticateToken,
  createCheckoutSession
);
router.post("/cancel-subscription", authenticateToken, cancelSubscription);
router.get("/session/:sessionId", authenticateToken, getSession);
router.get("/subscription", authenticateToken, getSubscription);

module.exports = router;
