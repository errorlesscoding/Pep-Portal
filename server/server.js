const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { verifyGeminiConnection } = require('./utils/gemini');

// Load environment variables
dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
]
  .map((origin) => origin && origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOptions = allowedOrigins.length
  ? {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
    }
  : {};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));
app.use('/api/interview', require('./routes/interviewRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AI Interview Preparation System API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await verifyGeminiConnection();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
