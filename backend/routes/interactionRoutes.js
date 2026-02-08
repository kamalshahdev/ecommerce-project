// routes/interactionRoutes.js
const express = require('express');
const router = express.Router();
const Interaction = require('../models/Interaction');

// @route   POST /api/interactions
// @desc    Log a user interaction
// @access  Public (should be protected in production)
router.post('/', async (req, res) => {
  try {
    const { userId, productId, action, metadata } = req.body;
    
    // Validate required fields
    if (!userId || !productId || !action) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, productId, and action are required' 
      });
    }
    
    // Validate action type
    const validActions = ['view', 'click', 'add_to_cart', 'purchase', 'wishlist', 'reco_impression', 'reco_click'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        message: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      });
    }
    
    const interaction = await Interaction.logInteraction(
      userId,
      productId,
      action,
      metadata || {}
    );
    
    res.status(201).json({
      message: 'Interaction logged successfully',
      interaction
    });
  } catch (error) {
    console.error('Error logging interaction:', error);
    res.status(500).json({ 
      message: 'Error logging interaction', 
      error: error.message 
    });
  }
});

// @route   GET /api/interactions/user/:userId
// @desc    Get user's interaction history
// @access  Private (should verify user owns these interactions)
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 50, action } = req.query;
    const userId = req.params.userId;
    
    let query = { userId };
    if (action) {
      query.action = action;
    }
    
    const interactions = await Interaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('productId');
    
    res.json({
      userId,
      interactions,
      count: interactions.length
    });
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    res.status(500).json({ 
      message: 'Error fetching interactions', 
      error: error.message 
    });
  }
});

// @route   GET /api/interactions/product/:productId
// @desc    Get product interaction stats
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const stats = await Interaction.getProductPopularity(productId);
    
    const totalInteractions = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    res.json({
      productId,
      stats,
      totalInteractions
    });
  } catch (error) {
    console.error('Error fetching product interactions:', error);
    res.status(500).json({ 
      message: 'Error fetching product stats', 
      error: error.message 
    });
  }
});

// @route   GET /api/interactions/analytics
// @desc    Get interaction analytics
// @access  Private/Admin
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }
    
    // Aggregate by action type
    const actionStats = await Interaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Top products by interactions
    const topProducts = await Interaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$productId',
          interactions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          productId: '$_id',
          interactions: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { interactions: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      actionStats,
      topProducts,
      dateRange: {
        start: startDate || 'all time',
        end: endDate || 'now'
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      message: 'Error fetching analytics', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/interactions/user/:userId
// @desc    Delete user's interaction history
// @access  Private (should verify user owns these interactions)
router.delete('/user/:userId', async (req, res) => {
  try {
    const result = await Interaction.deleteMany({ userId: req.params.userId });
    
    res.json({
      message: 'Interactions deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting interactions:', error);
    res.status(500).json({ 
      message: 'Error deleting interactions', 
      error: error.message 
    });
  }
});

module.exports = router;