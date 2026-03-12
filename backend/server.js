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
import cors from 'cors';

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

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

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

startServer();