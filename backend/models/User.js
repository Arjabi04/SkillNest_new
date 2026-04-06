import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  interests: [String],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  profileImage: { type: String, default: "" },
  headerImage: { type: String, default: "" },
  bio: { type: String, default: "" },
  notificationsEnabled: { type: Boolean, default: true }
}, { timestamps: true });


export default model('User', userSchema);
