// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/300'
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  brand: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Text index for search functionality
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for recommendation text (combines all relevant fields)
productSchema.virtual('recommendationText').get(function() {
  return `${this.name} ${this.description} ${this.category} ${this.tags.join(' ')} ${this.brand || ''}`;
});

module.exports = mongoose.model('Product', productSchema);