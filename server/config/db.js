const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-interview-prep';
    console.log(`Attempting connection to MongoDB at ${connUri}...`);
    
    // Attempt standard connection with 2s timeout
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Standard MongoDB connection failed: ${error.message}`);
    console.log('Spinning up an in-memory MongoDB server instance...');
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`In-memory MongoDB Connected successfully at URI: ${mongoUri}`);
    } catch (memError) {
      console.error(`Failed to start in-memory MongoDB: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
