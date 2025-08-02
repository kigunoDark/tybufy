const { stripe, stripeConfig, priceIds } = require("../lib/stripe-config");
const User = require("../models/User");

const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: "price_creator",
        planId: "creator",
        name: "Creator Plan",
        description: "Perfect for content creators",
        amount: 999,
        currency: "usd",
        interval: "month",
        features: [
          "25 scripts/month",
          "60 minutes audio",
          "30 thumbnails",
          "All voices",
          "HD export",
        ],
      },
      {
        id: "price_pro",
        planId: "pro",
        name: "Pro Plan",
        description: "For professional creators and small business",
        amount: 2499,
        currency: "usd",
        interval: "month",
        features: [
          "100 scripts/month",
          "200 minutes audio",
          "100 thumbnails",
          "API access",
          "Priority support",
        ],
      },
      {
        id: "price_agency",
        planId: "agency",
        name: "Agency Plan",
        description: "For agencies and large teams",
        amount: 7999,
        currency: "usd",
        interval: "month",
        features: [
          "Unlimited scripts",
          "800 minutes audio",
          "500 thumbnails",
          "Full API",
          "White label",
        ],
      },
    ];

    res.json({
      success: true,
      data: { plans },
    });
  } catch (error) {
    console.error("Get plans error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch plans",
    });
  }
};

const createCheckoutSession = async (req, res) => {
  try {
    const { priceId, planId } = req.body;

    if (!priceId || !planId) {
      return res.status(400).json({
        success: false,
        error: "Price ID and Plan ID are required",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const baseUrl = frontendUrl.startsWith("http")
      ? frontendUrl
      : `http://${frontendUrl}`;

    const currentPriceIds = priceIds[stripeConfig.mode];
    const stripePriceId = currentPriceIds[priceId];

    if (!stripePriceId) {
      return res.status(400).json({
        success: false,
        error: `Price ID not found for ${priceId} in ${stripeConfig.mode} mode`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: req.user.email,
      payment_method_types: ["card"],
      line_items: [{ price: stripePriceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${baseUrl}/?canceled=true`,
      metadata: { userId: req.user._id.toString(), planId: planId },
      subscription_data: {
        metadata: { userId: req.user._id.toString(), planId: planId },
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        mode: stripeConfig.mode,
      },
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create checkout session",
    });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        error: "No active subscription found",
      });
    }

    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        subscription: "free",
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        subscriptionEndDate: new Date(),
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message:
        "Subscription canceled. You can continue using your remaining credits.",
    });
  } catch (error) {
    console.error("❌ Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel subscription",
    });
  }
};

const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (session.metadata.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized session access",
      });
    }

    if (session.payment_status === "paid" && session.subscription) {
      const customerId =
        typeof session.customer === "object"
          ? session.customer.id
          : session.customer;

      const subscriptionId =
        typeof session.subscription === "object"
          ? session.subscription.id
          : session.subscription;

      const updateData = {
        subscription: session.metadata.planId,
        subscriptionStatus: "active",
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStartDate: new Date(),
        purchasedPlan: session.metadata.planId,
        "usage.scriptsGenerated": 0,
        "usage.audioGenerated": 0,
        "usage.thumbnailsGenerated": 0,
        "usage.lastReset": new Date(),
      };

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true }
      ).select("-password");

      return res.json({
        success: true,
        data: {
          paymentStatus: session.payment_status,
          planId: session.metadata.planId,
          user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            subscription: updatedUser.subscription,
            subscriptionStatus: updatedUser.subscriptionStatus,
            purchasedPlan: updatedUser.purchasedPlan,
            usage: updatedUser.usage,
            limits: updatedUser.getLimits(),
          },
        },
      });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: session.payment_status,
        planId: session.metadata.planId,
        pending: true,
      },
    });
  } catch (error) {
    console.error("❌ Session error:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to check payment session",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        subscription: user.subscription,
        subscriptionStatus: user.subscriptionStatus,
        purchasedPlan: user.purchasedPlan,
        usage: user.usage,
        limits: user.getLimits(),
        remaining: {
          scripts:
            user.getLimits().scriptsGenerated === -1
              ? -1
              : Math.max(
                  0,
                  user.getLimits().scriptsGenerated -
                    user.usage.scriptsGenerated
                ),
          audio:
            user.getLimits().audioGenerated === -1
              ? -1
              : Math.max(
                  0,
                  user.getLimits().audioGenerated - user.usage.audioGenerated
                ),
          thumbnails:
            user.getLimits().thumbnailsGenerated === -1
              ? -1
              : Math.max(
                  0,
                  user.getLimits().thumbnailsGenerated -
                    user.usage.thumbnailsGenerated
                ),
        },
      },
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get subscription info",
    });
  }
};

module.exports = {
  getPlans,
  createCheckoutSession,
  cancelSubscription,
  getSession,
  getSubscription,
};
