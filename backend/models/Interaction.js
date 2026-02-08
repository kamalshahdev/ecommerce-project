// models/Interaction.js
const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    // reco_impression: when a recommendation was shown
    // reco_click: when a user clicked a recommended item
    enum: ['view', 'click', 'add_to_cart', 'purchase', 'wishlist', 'reco_impression', 'reco_click'],
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
interactionSchema.index({ userId: 1, timestamp: -1 });
interactionSchema.index({ productId: 1, action: 1 });
interactionSchema.index({ userId: 1, action: 1, timestamp: -1 });

// Static method to log interaction
interactionSchema.statics.logInteraction = async function (userId, productId, action, metadata = {}) {
  try {
    const interaction = await this.create({
      userId,
      productId,
      action,
      metadata
    });
    return interaction;
  } catch (error) {
    console.error('Error logging interaction:', error);
    throw error;
  }
};

// Static method to get user's recent interactions
interactionSchema.statics.getUserRecentInteractions = async function (userId, limit = 20) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('productId');
};

// Static method to get product popularity
interactionSchema.statics.getProductPopularity = async function (productId) {
  const stats = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
};

module.exports = mongoose.model('Interaction', interactionSchema);