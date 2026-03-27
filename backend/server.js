import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';
import signupRoute from './routes/signup.js';
import loginRoute from './routes/login.js';
import forgotPasswordRoute from './routes/forgotPassword.js';
import hobbiesRoute from './routes/interests.js';
import profileRoute from './routes/profile.js';
import postRoute from './routes/posts.js';
import communityRoute from './routes/communities.js';
import adminRoute from './routes/admin.js';
import eventsRoute from './routes/events.js';
import notificationsRoute from './routes/notifications.js';
import recommendationsRoute from './routes/recommendations.js';
import marketplaceRoute from './routes/marketplace.js';
import cors from 'cors';
import Stripe from 'stripe';
import Product from './models/Product.js';

const app = express();
const getStripeClient = () => new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Stripe webhook requires raw body for signature verification.
app.post('/api/marketplace/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).send('Stripe webhook is not configured');
  }

  let event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const productId = session?.metadata?.productId;

      if (productId) {
        await Product.findOneAndUpdate(
          { _id: productId, isActive: true },
          { $set: { isActive: false } }
        );
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ msg: 'Webhook processing failed' });
  }
});

app.use(express.json());

// Handle preflight OPTIONS requests for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }
  next();
});

async function startServer() {
  await connectDB(); 

  app.get('/', (req, res) => {
    res.json({ msg: 'Welcome to the app' });
  });

  // Routes
  app.use('/api/signup', signupRoute);
  app.use('/api/login', loginRoute);
  app.use('/api/forgot-password', forgotPasswordRoute);
  app.use('/api/interests', hobbiesRoute);
  app.use('/api/profile', profileRoute);
  app.use('/api/posts', postRoute);
  app.use('/api/communities', communityRoute);
  app.use('/api/admin', adminRoute);
  app.use('/api/events', eventsRoute);
  app.use('/api/notifications', notificationsRoute);
  app.use('/api/recommendations', recommendationsRoute);
  app.use('/api/marketplace', marketplaceRoute);

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

startServer();