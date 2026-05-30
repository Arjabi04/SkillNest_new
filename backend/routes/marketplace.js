import { Router } from "express";
const router = Router();
import multer, { memoryStorage } from "multer";
import { createReadStream } from "streamifier";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Stripe from "stripe";
import auth from "../middleware/auth.js";

const getStripeClient = () => new Stripe(process.env.STRIPE_SECRET_KEY);

const storage = memoryStorage();
const upload = multer({ storage, limits: { files: 8, fileSize: 8 * 1024 * 1024 } });

const uploadFileToCloudinary = async (fileBuffer) => {
  const uploadPromise = new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "skillnest_marketplace" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    createReadStream(fileBuffer).pipe(uploadStream);
  });

  return uploadPromise;
};

const recalculateRatings = (product) => {
  if (!product.reviews.length) {
    product.ratingAverage = 0;
    product.ratingCount = 0;
    return;
  }

  const total = product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  product.ratingCount = product.reviews.length;
  product.ratingAverage = Number((total / product.ratingCount).toFixed(1));
};

// Get available categories from existing products.
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    const sorted = categories.filter(Boolean).sort((a, b) => a.localeCompare(b));
    res.json({ categories: sorted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Search and list marketplace products.
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      minPrice = "",
      maxPrice = "",
      sort = "newest",
      sellerId = "",
      status = "all",
    } = req.query;

    const query = {};
    if (status === "active") query.isActive = true;
    if (status === "sold") query.isActive = false;

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), "i");
      query.$or = [{ title: regex }, { description: regex }, { category: regex }];
    }

    if (category && category !== "all") {
      query.category = String(category).trim();
    }

    if (sellerId && String(sellerId).trim()) {
      query.seller = String(sellerId).trim();
    }

    const hasMin = String(minPrice).trim() !== "";
    const hasMax = String(maxPrice).trim() !== "";
    const min = hasMin ? Number(minPrice) : Number.NaN;
    const max = hasMax ? Number(maxPrice) : Number.NaN;

    if (!Number.isNaN(min) || !Number.isNaN(max)) {
      query.price = {};
      if (!Number.isNaN(min)) query.price.$gte = min;
      if (!Number.isNaN(max)) query.price.$lte = max;
    }

    let sortBy = { createdAt: -1 };
    if (sort === "price_asc") sortBy = { price: 1, createdAt: -1 };
    if (sort === "price_desc") sortBy = { price: -1, createdAt: -1 };
    if (sort === "rating_desc") sortBy = { ratingAverage: -1, ratingCount: -1, createdAt: -1 };

    const products = await Product.find(query)
      .populate("seller", "username profileImage")
      .populate("reviews.user", "username profileImage")
      .sort(sortBy)
      .limit(200);

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// List purchases for the currently authenticated user.
router.get("/purchases", auth, async (req, res) => {
  try {
    const purchases = await Product.find({ buyer: req.user.id })
      .populate("seller", "username profileImage")
      .sort({ purchasedAt: -1, createdAt: -1 })
      .limit(200);

    res.json({ purchases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Confirm a successful Stripe Checkout without relying on webhooks (useful for local dev).
router.post("/checkout/confirm", auth, async (req, res) => {
  try {
    const sessionId = String(req.body?.sessionId || "").trim();
    if (!sessionId) return res.status(400).json({ msg: "sessionId is required" });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ msg: "Stripe is not configured" });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) return res.status(404).json({ msg: "Checkout session not found" });
    if (session.mode !== "payment") return res.status(400).json({ msg: "Invalid checkout session mode" });
    if (session.payment_status !== "paid") {
      return res.status(400).json({ msg: `Payment not completed (status: ${session.payment_status})` });
    }

    const productId = session?.metadata?.productId;
    const buyerId = session?.metadata?.buyerId;
    const sellerId = session?.metadata?.sellerId;

    if (!productId) return res.status(400).json({ msg: "Missing productId in checkout session metadata" });
    if (buyerId && String(buyerId) !== String(req.user.id)) {
      return res.status(403).json({ msg: "This checkout session does not belong to the current user" });
    }

    const updated = await Product.findOneAndUpdate(
      {
        _id: productId,
        $or: [{ buyer: null }, { buyer: req.user.id }],
      },
      {
        $set: {
          isActive: false,
          buyer: req.user.id,
          purchasedAt: new Date(),
          stripeCheckoutSessionId: session.id,
        },
      },
      { new: true },
    ).populate("seller", "username profileImage");

    if (!updated) {
      return res.status(409).json({ msg: "Product is already purchased by another user" });
    }

    if (sellerId) {
      await Notification.createNotification({
        recipient: sellerId,
        sender: req.user.id,
        type: "system",
        title: "Item Sold",
        message: `${updated.title} has been purchased.`,
        actionUrl: "/marketplace",
        metadata: { productId: String(updated._id), buyerId: String(req.user.id) },
      });
    }

    res.json({ ok: true, product: updated });
  } catch (err) {
    console.error("Confirm checkout error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Create Stripe Checkout session for one-time product purchase.
router.post("/checkout/session", async (req, res) => {
  try {
    const { productId, buyerId } = req.body || {};

    if (!productId || !buyerId) {
      return res.status(400).json({ msg: "productId and buyerId are required" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ msg: "Stripe is not configured" });
    }

    const stripe = getStripeClient();

    const product = await Product.findById(productId).populate("seller", "_id username");
    if (!product || !product.isActive) {
      return res.status(404).json({ msg: "Product not available" });
    }

    if (String(product.seller?._id || "") === String(buyerId)) {
      return res.status(400).json({ msg: "You cannot buy your own listing" });
    }

    const unitAmount = Math.round(Number(product.price) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return res.status(400).json({ msg: "Invalid product price" });
    }

    const requestOrigin = typeof req.headers.origin === "string" ? req.headers.origin : "";
    const frontendUrl = process.env.FRONTEND_URL || requestOrigin || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: product.title,
              images: Array.isArray(product.images) ? product.images.slice(0, 1) : [],
            },
          },
        },
      ],
      success_url: `${frontendUrl}/marketplace?payment=success&sessionId={CHECKOUT_SESSION_ID}&arrivalTime=${encodeURIComponent(product.arrivalTime || "To be confirmed")}`,
      cancel_url: `${frontendUrl}/marketplace?payment=cancel`,
      metadata: {
        productId: String(product._id),
        buyerId: String(buyerId),
        sellerId: String(product.seller?._id || ""),
      },
    });

    res.json({ sessionId: session.id, checkoutUrl: session.url || null });
  } catch (err) {
    console.error("Create checkout session error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Create marketplace listing with multiple images.
router.post("/", upload.array("images", 6), async (req, res) => {
  try {
    const userId = req.body?.userId;
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const category = String(req.body?.category || "").trim();
    const arrivalTime = String(req.body?.arrivalTime || "").trim();
    const price = Number(req.body?.price);

    if (!userId || !title || !description || !category || !arrivalTime || Number.isNaN(price)) {
      return res.status(400).json({ msg: "userId, title, description, category, arrival time and price are required" });
    }

    const parsedArrival = new Date(`${arrivalTime}T00:00:00`);
    if (Number.isNaN(parsedArrival.getTime())) {
      return res.status(400).json({ msg: "Invalid arrival date" });
    }

    if (price < 0) {
      return res.status(400).json({ msg: "Price must be a positive number" });
    }

    const seller = await User.findById(userId);
    if (!seller) return res.status(404).json({ msg: "Seller not found" });

    const imageUrls = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const imageUrl = await uploadFileToCloudinary(file.buffer);
        imageUrls.push(imageUrl);
      }
    }

    const product = new Product({
      seller: userId,
      title,
      description,
      category,
      arrivalTime,
      price,
      images: imageUrls,
    });

    await product.save();
    await product.populate("seller", "username profileImage");

    res.json({ msg: "Product listed successfully", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Review a listing. Existing user review gets updated.
router.post("/:productId/reviews", async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.body?.userId;
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!userId || Number.isNaN(rating)) {
      return res.status(400).json({ msg: "userId and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (product.seller.toString() === userId.toString()) {
      return res.status(400).json({ msg: "You cannot review your own listing" });
    }

    const existingReview = product.reviews.find((review) => review.user.toString() === userId.toString());

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.createdAt = new Date();
    } else {
      product.reviews.push({ user: userId, rating, comment });
    }

    recalculateRatings(product);
    await product.save();
    await product.populate("reviews.user", "username profileImage");

    res.json({
      msg: existingReview ? "Review updated" : "Review added",
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount,
      reviews: product.reviews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Report a listing.
router.post("/:productId/report", async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.body?.userId;
    const reason = String(req.body?.reason || "").trim();
    const details = String(req.body?.details || "").trim();

    if (!userId || !reason) {
      return res.status(400).json({ msg: "userId and reason are required" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const existingPending = product.reports.find(
      (report) => report.reporter.toString() === userId.toString() && report.status === "pending"
    );

    if (existingPending) {
      return res.status(400).json({ msg: "You have already reported this listing" });
    }

    product.reports.push({ reporter: userId, reason, details });
    await product.save();

    res.json({ msg: "Report submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete own listing.
router.delete("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.body?.userId;

    if (!userId) return res.status(400).json({ msg: "userId is required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    if (product.seller.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "You can only delete your own listing" });
    }

    await Product.findByIdAndDelete(productId);
    res.json({ msg: "Listing deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
