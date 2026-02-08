// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const Order = require('../models/Order'); // Import Order model
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/admin/stats
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();

        // Get interaction counts
        const interactionCount = await Interaction.countDocuments();
        const orderCount = await Order.countDocuments(); // Count orders

        // Get recent interactions with details
        const recentInteractions = await Interaction.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('userId', 'name email')
            .populate('productId', 'name imageUrl');

        // Get interactions by type (for charts)
        const interactionsByType = await Interaction.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            counts: {
                users: userCount,
                products: productCount,
                interactions: interactionCount,
                orders: orderCount // Real count
            },
            recentActivity: recentInteractions,
            interactionsByType
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
});

module.exports = router;
