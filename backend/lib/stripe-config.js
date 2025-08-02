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
    price_creator: "price_1RpF2zK1IDYU2N55qz8OOXOF",
    price_pro: "price_1RpF3NK1IDYU2N55OaEW6776",
    price_agency: "price_1RpF3jK1IDYU2N55gGQs196r",
  },
  live: {
    price_creator: "price_1RpEBsKGtjox6w5rJ8booXZa",
    price_pro: "price_1RpECeKGtjox6w5ryTk4Vr6e",
    price_agency: "price_1RpEEUKGtjox6w5rGQjtKeKY",
  },
};

module.exports = {
  getStripeConfig,
  stripe,
  stripeConfig,
  priceIds,
};
