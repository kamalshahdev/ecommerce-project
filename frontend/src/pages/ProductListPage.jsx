// pages/ProductListPage.jsx - Professional UI with Pagination
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './ProductListPage.css';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [categories, setCategories] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const location = require('react-router-dom').useLocation();

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to parse query params (e.g. ?category=Electronics)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory, searchQuery, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      const uniqueCategories = [...new Set(response.data.products.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        sort: sortBy
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await axios.get(`${API_URL}/api/products`, { params });
      setProducts(response.data.products);
      setTotalPages(response.data.pages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to products section, not hero
    const productsSection = document.querySelector('.products-section');
    if (productsSection) {
      const offset = 100; // Offset from top
      const elementPosition = productsSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (currentPage > 1) {
      pages.push(
        <button key="prev" onClick={() => handlePageChange(currentPage - 1)} className="pagination-btn">
          ← Previous
        </button>
      );
    }

    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => handlePageChange(1)} className="pagination-btn">
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots1" className="pagination-dots">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="pagination-dots">...</span>);
      }
      pages.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)} className="pagination-btn">
          {totalPages}
        </button>
      );
    }

    if (currentPage < totalPages) {
      pages.push(
        <button key="next" onClick={() => handlePageChange(currentPage + 1)} className="pagination-btn">
          Next →
        </button>
      );
    }

    return pages;
  };

  if (loading && products.length === 0) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading amazing products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-btn">Try Again</button>
      </div>
    );
  }

  return (
    <div className="product-list-page">
      {/* Hero Section */}
      {/* Creative Minimalist Hero */}
      <section className="shop-hero-creative">
        <div className="shop-hero-content">
          <span className="shop-tag">Our Collection</span>
          <h1 className="shop-title">Curated Essentials</h1>
          <p className="shop-subtitle">Thoughtfully designed for the modern lifestyle.</p>
        </div>
      </section>

      <div className="container">
        {/* Filters Section */}
        <div className="filters-section">
          <div className="filter-group">
            <h3>Categories</h3>
            <div className="category-pills">
              <button
                className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('all')}
              >
                All Products
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="sort">Sort By:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-rating">Highest Rated</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-section">
          <h2 className="section-title">
            {searchQuery ? (
              <div className="search-results-header">
                <span>Results for "{searchQuery}"</span>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="clear-search-btn"
                >
                  ✕ Clear
                </button>
              </div>
            ) : (
              selectedCategory === 'all' ? 'All Products' : selectedCategory
            )}
            <span className="product-count">({products.length} items)</span>
          </h2>

          {loading ? (
            <div className="loading-grid">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <Link key={product._id} to={`/products/${product._id}`} className="product-link">
                  <ProductCard product={product} />
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 && !loading && (
            <div className="no-products">
              <p>No products found matching your criteria</p>
              <button onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }} className="reset-btn">
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;