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
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

app.use(express.json());

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

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

startServer();