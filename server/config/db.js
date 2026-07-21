const mongoose = require('mongoose');

// Configure Mongoose listeners
mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected! Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('Mongoose connection restored successfully!');
});

const connectDB = async (retries = 5, delay = 5000) => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`MongoDB Connection Attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) {
        console.error('All database connection attempts exhausted.');
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        } else {
          console.warn('WARNING: Running in offline development mode without active database connectivity.');
          break;
        }
      }
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;