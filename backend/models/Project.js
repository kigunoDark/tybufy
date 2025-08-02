const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      default: "Лайфстайл",
    },
    duration: {
      type: String,
      enum: ["short", "medium", "long", "extra_long"],
      default: "medium",
    },
    keyPoints: [String],
    script: {
      type: String,
      default: "",
    },
    audioFiles: [
      {
        filename: String,
        voiceId: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    quality: {
      score: Number,
      analysis: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["draft", "completed", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
