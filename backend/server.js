import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import signupRoute from "./routes/signup.js";
import loginRoute from "./routes/login.js";
import forgotPasswordRoute from "./routes/forgotPassword.js";
import hobbiesRoute from "./routes/interests.js";
import profileRoute from "./routes/profile.js";
import postRoute from "./routes/posts.js";
import communityRoute from "./routes/communities.js";
import adminRoute from "./routes/admin.js";
import eventsRoute from "./routes/events.js";
import notificationsRoute from "./routes/notifications.js";
import recommendationsRoute from "./routes/recommendations.js";
import marketplaceRoute from "./routes/marketplace.js";
import chatRoute from "./routes/chat.js";
import reportRoute from "./routes/reports.js";
import moderationRoute from "./routes/moderation.js";
import cors from "cors";
import Stripe from "stripe";
import { createTransport } from "nodemailer";
import Product from "./models/Product.js";
import User from "./models/User.js";
import Notification from "./models/Notification.js";
import configureChatSockets from "./socket/chatSocket.js";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    process.env.FRONTEND_URL,
    "https://skill-nest-new.vercel.app",
];

const isAllowedOrigin = (origin) => {
    if (!origin) return true;

    return allowedOrigins.some((allowedOrigin) => {
        if (!allowedOrigin) return false;
        return (
            origin === allowedOrigin ||
            /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
        );
    });
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
    preflightContinue: false,
    optionsSuccessStatus: 200,
};

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins
            .filter(Boolean)
            .concat(/^https:\/\/[a-z0-9-]+\.vercel\.app$/i),
        credentials: true,
    },
});

// Configure chat socket events
configureChatSockets(io);

const getStripeClient = () => new Stripe(process.env.STRIPE_SECRET_KEY);

const sendMarketplacePurchaseEmails = async ({
    buyerEmail,
    sellerEmail,
    productTitle,
    arrivalTime,
}) => {
    if (
        !process.env.EMAIL_HOST ||
        !process.env.EMAIL_PORT ||
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASSWORD
    ) {
        return;
    }

    const transporter = createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const emailJobs = [];

    if (buyerEmail) {
        emailJobs.push(
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: buyerEmail,
                subject: `Purchase confirmed: ${productTitle}`,
                html: `<p>Your payment was successful for <strong>${productTitle}</strong>.</p><p>Estimated arrival date: <strong>${arrivalTime}</strong>.</p><p>You can continue browsing more listings in SkillNest Marketplace.</p>`,
            }),
        );
    }

    if (sellerEmail) {
        emailJobs.push(
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: sellerEmail,
                subject: `Item sold: ${productTitle}`,
                html: `<p>Your listing <strong>${productTitle}</strong> has been purchased.</p><p>Estimated arrival date shared with buyer: <strong>${arrivalTime}</strong>.</p>`,
            }),
        );
    }

    await Promise.all(emailJobs);
};

app.use(cors(corsOptions));

// Stripe webhook requires raw body for signature verification.
app.post(
    "/api/marketplace/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const signature = req.headers["stripe-signature"];

        if (
            !process.env.STRIPE_SECRET_KEY ||
            !process.env.STRIPE_WEBHOOK_SECRET
        ) {
            return res.status(500).send("Stripe webhook is not configured");
        }

        let event;
        try {
            const stripe = getStripeClient();
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET,
            );
        } catch (err) {
            console.error(
                "Webhook signature verification failed:",
                err.message,
            );
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const productId = session?.metadata?.productId;
                const buyerId = session?.metadata?.buyerId;
                const sellerId = session?.metadata?.sellerId;

                if (productId) {
                    const purchasedProduct = await Product.findOneAndUpdate(
                        { _id: productId, isActive: true },
                        { $set: { isActive: false } },
                        { new: true },
                    );

                    if (purchasedProduct && buyerId && sellerId) {
                        const arrivalTime =
                            purchasedProduct.arrivalTime || "To be confirmed";

                        await Promise.all([
                            Notification.createNotification({
                                recipient: buyerId,
                                sender: sellerId,
                                type: "system",
                                title: "Payment Successful",
                                message: `Your payment was successful. Estimated arrival date: ${arrivalTime}.`,
                                actionUrl: "/marketplace",
                                metadata: {
                                    productId: String(purchasedProduct._id),
                                    arrivalTime,
                                },
                            }),
                            Notification.createNotification({
                                recipient: sellerId,
                                sender: buyerId,
                                type: "system",
                                title: "Item Sold",
                                message: `${purchasedProduct.title} has been purchased.`,
                                actionUrl: "/marketplace",
                                metadata: {
                                    productId: String(purchasedProduct._id),
                                    buyerId: String(buyerId),
                                },
                            }),
                        ]);

                        try {
                            const [buyer, seller] = await Promise.all([
                                User.findById(buyerId).select("email"),
                                User.findById(sellerId).select("email"),
                            ]);

                            await sendMarketplacePurchaseEmails({
                                buyerEmail: buyer?.email,
                                sellerEmail: seller?.email,
                                productTitle: purchasedProduct.title,
                                arrivalTime,
                            });
                        } catch (emailErr) {
                            console.error(
                                "Purchase email send error:",
                                emailErr,
                            );
                        }
                    }
                }
            }

            return res.json({ received: true });
        } catch (err) {
            console.error("Webhook processing error:", err);
            return res.status(500).json({ msg: "Webhook processing failed" });
        }
    },
);

app.use(express.json());

async function startServer() {
    await connectDB();

    app.get("/", (req, res) => {
        res.json({ msg: "Welcome to the app" });
    });
    app.get("/health", (_req, res) => {
        res.status(200).json({
            success: true,
            message: "SkillNest API is healthy",
        });
    });
    // Routes
    app.use("/api/signup", signupRoute);
    app.use("/api/login", loginRoute);
    app.use("/api/forgot-password", forgotPasswordRoute);
    app.use("/api/interests", hobbiesRoute);
    app.use("/api/profile", profileRoute);
    app.use("/api/posts", postRoute);
    app.use("/api/communities", communityRoute);
    app.use("/api/admin", adminRoute);
    app.use("/api/events", eventsRoute);
    app.use("/api/notifications", notificationsRoute);
    app.use("/api/recommendations", recommendationsRoute);
    app.use("/api/marketplace", marketplaceRoute);
    app.use("/api/chat", chatRoute);
    app.use("/api/reports", reportRoute);
    app.use("/api/moderation", moderationRoute);

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () =>
        console.log(`🚀 Server running on http://localhost:${PORT}`),
    );
}

startServer();
