const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../lib/jwt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    subscription: {
      type: String,
      enum: ["free", "creator", "pro", "agency"],
      default: "free",
    },
    purchasedPlan: {
      type: String,
      enum: ["free", "creator", "pro", "agency"],
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "canceled", "past_due", "unpaid", "trialing"],
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    usage: {
      scriptsGenerated: { type: Number, default: 0 },
      audioGenerated: { type: Number, default: 0 },
      thumbnailsGenerated: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.getLimits = function () {
  const baseLimits = {
    free: {
      scriptsGenerated: 3,
      audioGenerated: 10000,
      thumbnailsGenerated: 5,
    },
    creator: {
      scriptsGenerated: 25,
      audioGenerated: 60000,
      thumbnailsGenerated: 30,
    },
    pro: {
      scriptsGenerated: 100,
      audioGenerated: 200000,
      thumbnailsGenerated: 100,
    },
    agency: {
      scriptsGenerated: -1,
      audioGenerated: 800000,
      thumbnailsGenerated: 500,
    },
  };

  if (
    this.subscriptionStatus === "canceled" &&
    this.subscription === "free" &&
    this.purchasedPlan
  ) {
    return baseLimits[this.purchasedPlan];
  }

  return baseLimits[this.subscription] || baseLimits.free;
};

userSchema.methods.canUseFeature = function (featureType, amount = 1) {
  const limits = this.getLimits();
  const currentUsage = this.usage[featureType] || 0;

  if (limits[featureType] === -1) return true;
  return currentUsage + amount <= limits[featureType];
};

userSchema.methods.isSubscriptionActive = function () {
  if (this.subscription === "free") return true;
  return (
    this.subscriptionStatus === "active" ||
    this.subscriptionStatus === "trialing"
  );
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  const payload = {
    userId: this._id,
    email: this.email,
    name: this.name,
    subscription: this.subscription,
  };

  return generateToken(payload);
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model("User", userSchema);