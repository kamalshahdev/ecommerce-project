// routes/recommenderRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Interaction = require('../models/Interaction');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @route   GET /api/recommender/online-metrics
// @desc    Get online metrics (CTR, total clicks) from MongoDB
// @access  Private/Admin
router.get('/online-metrics', protect, admin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    // Count total views and clicks in the last X days
    const stats = await Interaction.aggregate([
      {
        $match: {
          timestamp: { $gte: dateLimit }
        }
      },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          clicks: {
            $sum: {
              $cond: [{ $in: ["$action", ["click", "add_to_cart", "purchase"]] }, 1, 0]
            }
          },
          views: {
            $sum: {
              $cond: [{ $eq: ["$action", "view"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || { totalInteractions: 0, clicks: 0, views: 0 };
    // CTR = Clicks / Views (avoid division by zero)
    const ctr = result.views > 0 ? result.clicks / result.views : 0;

    res.json({
      ctr,
      clicks: result.clicks,
      views: result.views,
      total: result.totalInteractions,
      days
    });

  } catch (error) {
    console.error('Error fetching online metrics:', error);
    res.status(500).json({ message: 'Error fetching online metrics' });
  }
});

// @route   GET /api/recommender/evaluate
// @desc    Proxy to ML service /evaluate
// @access  Private/Admin
router.get('/evaluate', protect, admin, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/evaluate`, {
      params: req.query,
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('ML Service evaluate error:', error.message);
    res.status(500).json({ message: 'ML Service unavailable', error: error.message });
  }
});

// @route   POST /api/recommender/sync
// @desc    Trigger sync of data to ML service
// @access  Private/Admin
router.post('/sync', protect, admin, async (req, res) => {
  try {
    // 1. Fetch all data from Mongo
    const products = await Product.find({}, 'name description category tags brand price');
    const interactions = await Interaction.find({});

    // 2. Format for ML Service
    const payload = {
      products: products.map(p => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description || "",
        category: p.category || "",
        tags: p.tags || [],
        brand: p.brand || "",
        price: p.price || 0
      })),
      interactions: interactions.map(i => ({
        user_id: i.userId ? i.userId.toString() : "anon",
        product_id: i.productId.toString(),
        action: i.action,
        timestamp: i.timestamp.toISOString()
      }))
    };

    // 3. Send to ML Service
    const response = await axios.post(`${ML_SERVICE_URL}/sync`, payload);
    res.json(response.data);

  } catch (error) {
    console.error('Sync error:', error.message);
    res.status(500).json({ message: 'Sync failed', error: error.message });
  }
});

module.exports = router;
