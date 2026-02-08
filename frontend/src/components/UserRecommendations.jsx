// components/UserRecommendations.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './UserRecommendations.css';

const UserRecommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!user) return;

            try {
                // Get user-based recommendations
                const userId = user._id || localStorage.getItem('userId');
                const res = await axios.get(`${API_URL}/api/recommender/user/${userId}`);

                // If ML service returns products, use them
                if (res.data && res.data.length > 0) {
                    setRecommendations(res.data);
                } else {
                    // Fallback to top rated if no personal recs yet
                    const fallbackRes = await axios.get(`${API_URL}/api/products?limit=4&sort=rating`);
                    setRecommendations(fallbackRes.data.products || []);
                }
            } catch (err) {
                console.error('Error fetching user recommendations:', err);
                // Fallback
                try {
                    const fallbackRes = await axios.get(`${API_URL}/api/products?limit=4&sort=rating`);
                    setRecommendations(fallbackRes.data.products || []);
                } catch (e) {
                    console.error('Fallback failed');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [user, API_URL]);

    if (!user || loading || recommendations.length === 0) return null;

    const formatPKR = (value) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    return (
        <section className="user-recs-section">
            <div className="container">
                <div className="section-header">
                    <h2>Recommended For You</h2>
                    <p>Based on your recent activity</p>
                </div>
                <div className="recs-grid">
                    {recommendations.slice(0, 4).map((product, index) => (
                        <Link
                            to={`/products/${product._id}`}
                            key={product._id}
                            className="rec-card"
                            onClick={() => {
                                // Log interaction (fire and forget)
                                if (user && user._id) {
                                    axios.post(`${API_URL}/api/interactions`, {
                                        userId: user._id,
                                        productId: product._id,
                                        action: 'reco_click',
                                        metadata: { position: index, source: 'user_recommendations' }
                                    }).catch(e => console.error('Log error', e));
                                }
                            }}
                        >
                            <div className="rec-image">
                                <img src={product.imageUrl} alt={product.name} />
                            </div>
                            <div className="rec-info">
                                <h4>{product.name}</h4>
                                <p className="rec-price">{formatPKR(product.price)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default UserRecommendations;
