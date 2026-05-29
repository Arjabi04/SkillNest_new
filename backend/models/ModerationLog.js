import { Schema, model } from "mongoose";

const moderationLogSchema = new Schema(
  {
    targetPost: { type: Schema.Types.ObjectId, ref: "Post", default: null, index: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: {
      type: String,
      enum: ["dismiss_reports", "remove_post", "warn_user", "suspend_user", "ban_user"],
      required: true,
      index: true,
    },
    note: { type: String, default: "", trim: true, maxlength: 1000 },
    actor: {
      type: String,
      enum: ["admin"],
      default: "admin",
      index: true,
    },
    actorId: { type: String, default: "admin", trim: true },
    actorUsername: { type: String, default: "admin", trim: true },
    metadata: {
      durationDays: { type: Number, default: null },
      expiresAt: { type: Date, default: null },
      reportCount: { type: Number, default: null },
      priorityScore: { type: Number, default: null },
    },
  },
  { timestamps: true, minimize: false }
);

moderationLogSchema.index({ createdAt: -1 });

export default model("ModerationLog", moderationLogSchema);

