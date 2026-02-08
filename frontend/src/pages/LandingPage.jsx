// pages/LandingPage.jsx - Creative Figma-Style Design
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, feats] = await Promise.all([
          axios.get(`${API_URL}/api/categories`), // Now fetches categories with images
          axios.get(`${API_URL}/api/products?limit=3&sort=-rating`) // Limit 3 for special layout
        ]);
        setCategories(cats.data);
        setFeaturedProducts(feats.data.products);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL]);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="landing-creative">
      {/* 1. Ultra-Modern Hero Section */}
      <section className="creative-hero">
        <div className="hero-text-side">
          <span className="hero-tag">New Collection 2026</span>
          <h1 className="hero-title">
            Redefine <br />
            <span className="highlight-text">Your Style.</span>
          </h1>
          <p className="hero-sub">
            Curated essentials for the modern minimalist.
            Experience quality like never before.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="btn-primary-creative">Explore Shop</Link>
            <Link to="/about" className="btn-text">Our Story ↗</Link>
          </div>
        </div>
        <div className="hero-visual-side">
          <div className="visual-card card-1">
            <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" alt="Watch" />
          </div>
          <div className="visual-card card-2">
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" alt="Headphones" />
          </div>
        </div>
      </section>


      {/* 3. Bento Grid Categories */}
      <section className="bento-section">
        <div className="section-head">
          <h2>Shop by Category</h2>
          <p>Find what sparks your joy</p>
        </div>
        <div className="bento-grid">
          {/* Dynamic categories with their own images from API */}
          {categories.map((cat, index) => (
            <Link
              to={`/shop?category=${encodeURIComponent(cat.name)}`}
              key={cat._id || cat.name}
              className={`bento-item item-${index % 5}`}
              style={{ backgroundImage: `url(${cat.imageUrl})` }}
            >
              <span className="bento-label">{cat.name}</span>
              <div className="bento-overlay"></div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Editorial Featured Section */}
      <section className="editorial-feat">
        <div className="editorial-content">
          <h2>Editor's Pick</h2>
          <p>Hand-selected items that define this season.</p>
        </div>
        <div className="feat-cards-row">
          {featuredProducts.map((p) => (
            <Link to={`/products/${p._id}`} key={p._id} className="feat-minimal-card">
              <div className="feat-img-box">
                <img src={p.imageUrl} alt={p.name} />
              </div>
              <div className="feat-details">
                <h3>{p.name}</h3>
                <span>PKR {p.price.toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Minimal Newsletter */}
      <section className="creative-newsletter">
        <h2>Join the Inner Circle</h2>
        <p>Get exclusive drops and early access.</p>
        <div className="input-group-creative">
          <input type="email" placeholder="email@address.com" />
          <button>→</button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;