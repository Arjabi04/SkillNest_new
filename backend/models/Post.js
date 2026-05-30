import { Schema, model } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true, maxlength: 120 },
    details: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "dismissed", "actioned"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewNote: { type: String, default: "", trim: true, maxlength: 500 },
    reviewedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const postSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    community: { type: Schema.Types.ObjectId, ref: "Community" },
    likes: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    reports: { type: [reportSchema], default: [] },
    moderation: {
      state: {
        type: String,
        enum: ["visible", "hidden", "removed"],
        default: "visible",
        index: true,
      },
      isHidden: { type: Boolean, default: false, index: true },
      autoHidden: { type: Boolean, default: false },
      hiddenAt: { type: Date, default: null },
      removedAt: { type: Date, default: null },
      reportCount: { type: Number, default: 0, min: 0 },
      uniqueReportCount: { type: Number, default: 0, min: 0 },
      firstReportedAt: { type: Date, default: null },
      lastReportedAt: { type: Date, default: null },
      priorityScore: { type: Number, default: 0, min: 0, index: true },
      priorityLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "low",
        index: true,
      },
      previousViolations: { type: Number, default: 0, min: 0 },
      flags: {
        massReportingSuspected: { type: Boolean, default: false },
        repeatedOffender: { type: Boolean, default: false },
      },
      lastReviewedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export default model("Post", postSchema);
