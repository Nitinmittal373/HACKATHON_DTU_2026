const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shastra';

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`  ✓  MongoDB connected: ${uri}`);
  } catch (err) {
    console.error('  ✗  MongoDB connection failed:', err.message);
    console.log('  ℹ  App will run with in-memory demo data instead.\n');
  }
}

module.exports = { connectDB };
