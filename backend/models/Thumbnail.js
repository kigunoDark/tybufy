const mongoose = require("mongoose");

const thumbnailGenerationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    userQuery: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
    },

    transcriptText: {
      type: String,
      default: "",
      maxLength: 2000,
    },

    promptCount: {
      type: Number,
      default: 3,
      min: 1,
      max: 4,
    },

    model: {
      type: String,
      default: "gemini",
    },

    forRowView: {
      type: Boolean,
      default: true,
    },

    useLikeness: {
      type: Boolean,
      default: false,
    },

    previousPrompts: [String],

    rowId: String,
    rowTitle: String,
    generatedThumbnails: [
      {
        thumbnailId: { type: String, required: true },
        groupId: { type: String, required: true },

        promptData: {
          prompt: { type: String, required: true },
        },

        imageFile: String,

        seed: Number,
        rowIndex: Number,

        used: { type: Boolean, default: false },
        liked: { type: Boolean, default: false },
        downloaded: { type: Boolean, default: false },
        croppedSubjectImage: { type: String, default: null },
        maskFile: { type: String, default: null },
        originalSubjectImage: { type: String, default: null },
        referenceImage: { type: String, default: null },
        subjectImageBounds: {
          top: Number,
          left: Number,
          width: Number,
          height: Number,
        },
      },
    ],

    analytics: {
      totalGenerationTime: Number,
      promptGenerationTime: Number,
      imageGenerationTime: Number,
      successRate: Number,
      totalThumbnails: Number,
      successfulThumbnails: Number,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "error"],
      default: "pending",
    },

    errorMessage: String,
  },
  {
    timestamps: true,
  }
);
thumbnailGenerationSchema.index({ userId: 1, createdAt: -1 });
thumbnailGenerationSchema.index({ status: 1 });

thumbnailGenerationSchema.methods.getVidIQFormat = function () {
  return this.generatedThumbnails.map((thumb) => ({
    group_id: thumb.groupId,
    prompt_data: {
      prompt: thumb.promptData.prompt,
    },
    row_id: this.rowId,
    row_index: thumb.rowIndex,
    row_title: this.rowTitle,
    seed: thumb.seed,
    thumbnail_id: thumb.thumbnailId,
    transcript_text: this.transcriptText,
    use_likeness: this.useLikeness,
    user_query: this.userQuery,

    image_file: thumb.imageFile,
    cropped_subject_image: thumb.croppedSubjectImage,
    mask_file: thumb.maskFile,
    original_subject_image: thumb.originalSubjectImage,
    reference_image: thumb.referenceImage,
    subject_image_bounds: thumb.subjectImageBounds,
  }));
};

thumbnailGenerationSchema.methods.markThumbnailAsUsed = function (thumbnailId) {
  const thumbnail = this.generatedThumbnails.find(
    (t) => t.thumbnailId === thumbnailId
  );
  if (thumbnail) {
    thumbnail.used = true;
    return this.save();
  }
  return Promise.reject(new Error("Thumbnail not found"));
};

module.exports = mongoose.model(
  "ThumbnailGeneration",
  thumbnailGenerationSchema
);
