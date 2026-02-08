// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const { protect, admin } = require('../middleware/auth');

// Python ML service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @route   GET /api/products
// @desc    Get all products with optional filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, limit = 12, page = 1, sort = '-createdAt' } = req.query;

    let query = {};

    // Build query
    if (category && category !== 'all') {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sort);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
      hasMore: parseInt(page) < Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// @route   GET /api/products/categories
// @desc    Get all unique categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Check if id is valid ObjectId to avoid CastError for bad paths
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// @route   GET /api/products/:id/recommendations
// @desc    Get product recommendations from ML service
// @access  Public
router.get('/:id/recommendations', async (req, res) => {
  try {
    const productId = req.params.id;
    const { method = 'content', top_n = 5 } = req.query;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    try {
      // Call Python ML service
      const mlResponse = await axios.get(
        `${ML_SERVICE_URL}/recommend/item/${productId}`,
        {
          params: { method, top_n },
          timeout: 5000
        }
      );

      const { recommended_ids, scores } = mlResponse.data;

      // Map ML ids back to Mongo products (keep ML ordering)
      const products = await Product.find({ _id: { $in: recommended_ids } });
      const pMap = new Map(products.map(p => [String(p._id), p]));
      const recommendationsWithScores = (recommended_ids || [])
        .map((id, idx) => {
          const rec = pMap.get(String(id));
          if (!rec) return null;
          return {
            ...rec.toObject(),
            similarityScore: (scores && scores[idx]) ? scores[idx] : 0
          };
        })
        .filter(Boolean);

      res.json({
        productId,
        recommendations: recommendationsWithScores,
        method,
        mlServiceUsed: true
      });

    } catch (mlError) {
      console.error('ML Service error:', mlError.message);

      // Fallback: Return similar products from same category
      const fallbackRecommendations = await Product.find({
        category: product.category,
        _id: { $ne: productId }
      }).limit(parseInt(top_n));

      res.json({
        productId,
        recommendations: fallbackRecommendations,
        method: 'fallback-category',
        mlServiceUsed: false,
        fallbackReason: 'ML service unavailable'
      });
    }

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      message: 'Error getting recommendations',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product (Admin only)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: 'Error creating product', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;