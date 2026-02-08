// pages/ProductPage.jsx - Cinematic Sticky Layout
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import RecommendationList from '../components/RecommendationList';
import './ProductPage.css';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, getItemQuantity } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const userId = localStorage.getItem('userId') || null;

  const logInteraction = useCallback(async (action, metadata = {}) => {
    if (!userId) return;
    try {
      await axios.post(`${API_URL}/api/interactions`, {
        userId, productId: id, action, metadata
      });
    } catch (err) { console.error(err); }
  }, [API_URL, userId, id]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/products/${id}`);
        setProduct(response.data);
        logInteraction('view');
      } catch (err) {
        console.error(err);
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, API_URL, logInteraction]);

  const handleAddToCart = async () => {
    if (!product) return;
    logInteraction('add_to_cart', { quantity });
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) return <div className="loader-cinematic"><div className="spinner"></div></div>;
  if (!product) return <div className="error-cinematic">Product not found.</div>;

  return (
    <>
      <div className="product-cinematic">

        {/* Visual Side - Sticky */}
        <div className="cinematic-visual">
          <div className="visual-wrapper">
            <img src={product.imageUrl} alt={product.name} />
            <div className="visual-badge">New Arrival</div>
          </div>
        </div>

        {/* Content Side - Scrollable */}
        <div className="cinematic-content">
          <div className="content-wrapper">

            <span className="cinematic-category">{product.category}</span>
            <h1 className="cinematic-title">{product.name}</h1>

            <div className="cinematic-price-row">
              <span className="price">PKR {product.price.toLocaleString()}</span>
              <div className="rating">
                {'★'.repeat(Math.round(product.rating || 0))}
                <span className="count">({product.numReviews} Reviews)</span>
              </div>
            </div>

            <p className="cinematic-desc-preview">
              {product.description.substring(0, 100)}...
            </p>

            <div className="actions-cluster">
              <div className="qty-selector-minimal">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
              </div>
              <button
                className={`btn-cinematic-add ${addedToCart ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                {addedToCart ? 'In Bag' : 'Add to Bag'}
              </button>
            </div>

            <div className="cinematic-divider"></div>

            {/* Tabs for detailed content */}
            <div className="cinematic-tabs">
              <button
                className={activeTab === 'description' ? 'active' : ''}
                onClick={() => setActiveTab('description')}
              >
                Details
              </button>
              <button
                className={activeTab === 'specs' ? 'active' : ''}
                onClick={() => setActiveTab('specs')}
              >
                Specs
              </button>
              <button
                className={activeTab === 'shipping' ? 'active' : ''}
                onClick={() => setActiveTab('shipping')}
              >
                Shipping
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'description' && (
                <div className="text-block">
                  <p>{product.description}</p>
                  <ul className="feature-list">
                    <li>Premium material construction</li>
                    <li>Designed for modern lifestyle</li>
                    <li>Authenticity guaranteed</li>
                  </ul>
                </div>
              )}
              {activeTab === 'specs' && (
                <div className="specs-grid">
                  <div className="spec-item"><label>Stock</label> <span>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></div>
                  <div className="spec-item"><label>SKU</label> <span>{product._id.substring(0, 8).toUpperCase()}</span></div>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="text-block">
                  <p>Free express shipping on all orders over PKR 5,000.</p>
                  <p>Returns accepted within 30 days.</p>
                </div>
              )}
            </div>



          </div>
        </div>
      </div>

      {/* Full Width Recommendations */}
      <div className="product-recommendations-wrapper">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <RecommendationList productId={id} limit={5} title="Complete the Look" />
        </div>
      </div>
    </>
  );
};

export default ProductPage;