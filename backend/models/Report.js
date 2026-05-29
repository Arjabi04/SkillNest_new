import { Schema, model } from "mongoose";

export const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Hate Speech",
  "NSFW Content",
  "Misinformation",
  "Violence",
  "Copyright Issue",
  "Other",
];

export const REPORT_STATUSES = ["pending", "reviewed", "dismissed", "removed"];

const reportSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: REPORT_STATUSES, default: "pending", index: true },
    priorityScore: { type: Number, required: true, min: 0, index: true },
    signals: {
      uniqueReports: { type: Number, default: 0, min: 0 },
      recentReports: { type: Number, default: 0, min: 0 },
      previousViolations: { type: Number, default: 0, min: 0 },
      reporterTrustScore: { type: Number, default: 0.5, min: 0, max: 1 },
      massReportingSuspected: { type: Boolean, default: false },
    },
  },
  { minimize: false }
);

reportSchema.index({ postId: 1, reportedBy: 1 }, { unique: true });
reportSchema.index({ postId: 1, status: 1, createdAt: -1 });
reportSchema.index({ postId: 1, priorityScore: -1, createdAt: -1 });

export default model("Report", reportSchema);

