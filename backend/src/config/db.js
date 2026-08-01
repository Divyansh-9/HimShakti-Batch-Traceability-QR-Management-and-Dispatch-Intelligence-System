const mongoose = require('mongoose');

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ [Intern 2] MongoDB Atlas connected — himshakti DB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
}

module.exports = { connectDB };
