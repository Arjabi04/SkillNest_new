import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

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
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: "", trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const productSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    purchasedAt: { type: Date, default: null, index: true },
    stripeCheckoutSessionId: { type: String, default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0, index: true },
    arrivalTime: { type: String, required: true, trim: true, maxlength: 120 },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    reviews: { type: [reviewSchema], default: [] },
    reports: { type: [reportSchema], default: [] },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text", category: "text" });

export default model("Product", productSchema);
