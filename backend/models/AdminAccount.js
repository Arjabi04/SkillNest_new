import { Schema, model } from "mongoose";

const adminAccountSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    createdBy: { type: String, default: "admin", trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default model("AdminAccount", adminAccountSchema);

