import { Schema, model } from "mongoose";

const bannedUserSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bannedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sourcePostId: { type: Schema.Types.ObjectId, ref: "Post", default: null },
  banType: { type: String, enum: ['temporary', 'permanent'], required: true },
  reason: { type: String, default: "" },
  expiresAt: { type: Date },
  bannedAt: { type: Date, default: Date.now },
  appealStatus: {
    type: String,
    enum: ['none', 'pending', 'rejected'],
    default: 'none'
  },
  appealMessage: { type: String, default: "" },
  appealedAt: { type: Date, default: null },
  appealReviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  appealReviewedAt: { type: Date, default: null },
  appealReviewNote: { type: String, default: "" }
}, { _id: false });

const communitySchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  interests: [String],
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  admins: [{ type: Schema.Types.ObjectId, ref: "User" }], 
  moderators: [{ type: Schema.Types.ObjectId, ref: "User" }],
  bannedUsers: [bannedUserSchema],
  rules: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' // Initial state for admin review
  },
  deletionRequested: { type: Boolean, default: false },
  deletionRequestedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default model("Community", communitySchema);
