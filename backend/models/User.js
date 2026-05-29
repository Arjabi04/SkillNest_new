import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: true },
  pendingEmail: { type: String, default: '' },
  emailVerificationToken: { type: String, default: '' },
  emailVerificationExpires: { type: Date },
  interests: [String],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  profileImage: { type: String, default: "" },
  headerImage: { type: String, default: "" },
  bio: { type: String, default: "" },  // <-- new field
  trustScore: { type: Number, default: 0.5, min: 0, max: 1 },
  moderation: {
    warningCount: { type: Number, default: 0, min: 0 },
    violationCount: { type: Number, default: 0, min: 0 },
    suspendedUntil: { type: Date, default: null },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: "", trim: true, maxlength: 500 },
    lastActionAt: { type: Date, default: null },
  },
}, { timestamps: true });


export default model('User', userSchema);
