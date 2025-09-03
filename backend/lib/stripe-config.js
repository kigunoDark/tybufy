require("dotenv").config();

const getStripeConfig = () => {
  const mode = process.env.STRIPE_MODE || "test";
  const isProduction = process.env.NODE_ENV === "production";
  const actualMode = isProduction ? "live" : mode;

  const config = {
    secret:
      actualMode === "live"
        ? process.env.STRIPE_LIVE_SECRET
        : process.env.STRIPE_TEST_SECRET,
    publishable:
      actualMode === "live"
        ? process.env.STRIPE_LIVE_PUBLISHABLE
        : process.env.STRIPE_TEST_PUBLISHABLE,
    mode: actualMode,
  };

  return config;
};

const stripeConfig = getStripeConfig();
const stripe = require("stripe")(stripeConfig.secret);

const priceIds = {
  test: {
    boost: "price_1S3PEKKGtjox6w5ruQJkiThU",
    pro: "price_1S3PJBKGtjox6w5rdL90zKhC",
  },
  live: {
    boost: "price_1S3PEKKGtjox6w5ruQJkiThU",
    pro: "price_1S3PJBKGtjox6w5rdL90zKhC",
  },
};

module.exports = {
  getStripeConfig,
  stripe,
  stripeConfig,
  priceIds,
};
