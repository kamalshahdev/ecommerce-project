// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes
    await createIndexes();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createIndexes = async () => {
  const Product = require('../models/Product');
  const Interaction = require('../models/Interaction');
  
  try {
    await Product.createIndexes();
    await Interaction.createIndexes();
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = connectDB;