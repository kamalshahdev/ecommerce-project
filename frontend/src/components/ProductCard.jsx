// components/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, showSimilarityScore = false }) => {
  const formatPrice = (price) => {
    try {
      return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR'
      }).format(price);
    } catch {
      return `PKR ${price}`;
    }
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`} className="product-link">
        <div className="product-image-container">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="product-image"
          />
          {showSimilarityScore && product.similarityScore && (
            <div className="similarity-badge">
              {Math.round(product.similarityScore * 100)}% Match
            </div>
          )}
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          
          {product.brand && (
            <p className="product-brand">{product.brand}</p>
          )}

          <p className="product-description">
            {product.description.length > 80 
              ? `${product.description.substring(0, 80)}...` 
              : product.description}
          </p>

          <div className="product-footer">
            <span className="product-price">{formatPrice(product.price)}</span>
            
            {product.rating > 0 && (
              <div className="product-rating">
                <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
                <span className="rating-count">({product.numReviews})</span>
              </div>
            )}
          </div>

          <div className="product-tags">
            {product.tags && product.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;