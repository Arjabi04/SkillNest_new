import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    image: { type: String, default: "" },
    tags: { type: [String], default: [] },
    community: { type: Schema.Types.ObjectId, ref: "Community" },
  },
  { timestamps: true }
);

export default model("Post", postSchema);
