const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { verifyGeminiConnection } = require('./utils/gemini');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Verify Gemini Connection
verifyGeminiConnection();

const app = express();

// Middleware
app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
