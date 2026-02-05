import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    image: { type: String, default: "" },
    tags: { type: [String], default: [] },
    community: { type: Schema.Types.ObjectId, ref: "Community" },
    likes: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default model("Post", postSchema);
