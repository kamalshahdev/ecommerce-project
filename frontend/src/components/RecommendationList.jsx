// components/RecommendationList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './ProductCard';
import './RecommendationList.css';

const RecommendationList = ({ productId, userId, limit = 4, title = "Recommended for You" }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [method, setMethod] = useState('hybrid');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!productId) return;

      setLoading(true);
      setError(null);

      try {
        let currentMethod = method;
        let response = await axios.get(
          `${API_URL}/api/products/${productId}/recommendations`,
          { params: { method: currentMethod, top_n: limit } }
        );

        let recs = response.data.recommendations || [];

        // Fallback: If collaborative returns nothing, try hybrid or content
        if (recs.length === 0 && currentMethod === 'collaborative') {
          console.log('Collaborative returned 0, falling back to hybrid');
          const fallback = await axios.get(
            `${API_URL}/api/products/${productId}/recommendations`,
            { params: { method: 'hybrid', top_n: limit } }
          );
          recs = fallback.data.recommendations || [];
        }

        setRecommendations(recs);

        // Log impression
        if (userId && recs.length > 0) { // ... (logging logic remains same)
          try {
            await axios.post(`${API_URL}/api/interactions`, {
              userId,
              productId,
              action: 'reco_impression',
              metadata: {
                source: 'recommendation_widget',
                context: 'product_page',
                method: currentMethod,
                shownIds: recs.map(r => r._id)
              }
            });
          } catch (err) { }
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId, method, API_URL, userId, limit]);

  const handleProductClick = async (recProductId) => {
    // Log interaction when user clicks a recommendation
    if (userId) {
      try {
        await axios.post(`${API_URL}/api/interactions`, {
          userId,
          productId: recProductId,
          action: 'reco_click',
          metadata: {
            source: 'recommendation',
            fromProductId: productId
          }
        });
      } catch (err) {
        console.error('Error logging interaction:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="recommendation-section">
        <h2>Recommended for You</h2>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendation-section">
        <h2>Recommended for You</h2>
        <div className="error-message">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendation-section">
        <h2>Recommended for You</h2>
        <p>No recommendations available at this time.</p>
      </div>
    );
  }

  return (
    <div className="recommendation-section">
      <div className="recommendation-header">
        <h2>{title}</h2>
        <div className="method-toggle">
          <button
            className={method === 'hybrid' ? 'active' : ''}
            onClick={() => setMethod('hybrid')}
          >
            Hybrid
          </button>
          <button
            className={method === 'content' ? 'active' : ''}
            onClick={() => setMethod('content')}
          >
            Similar
          </button>
          <button
            className={method === 'collaborative' ? 'active' : ''}
            onClick={() => setMethod('collaborative')}
          >
            Also Bought
          </button>
        </div>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((product) => (
          <div key={product._id} onClick={() => handleProductClick(product._id)}>
            <ProductCard product={product} showSimilarityScore={method === 'content' || method === 'hybrid'} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationList;