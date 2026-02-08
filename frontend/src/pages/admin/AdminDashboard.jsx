import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminPages.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        const res = await axios.get(`${API_URL}/api/admin/stats`, config);
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API_URL]);

  if (loading) return (
    <AdminLayout title="Dashboard">
      <div className="admin-loading">Loading dashboard...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Admin Dashboard">
      {error && <div className="admin-error">{error}</div>}

      {/* Key Metrics Cards */}
      <div className="admin-grid">
        <div className="admin-card metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-info">
            <h3>Total Users</h3>
            <p className="metric-value">{stats?.counts?.users || 0}</p>
          </div>
        </div>

        <div className="admin-card metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-info">
            <h3>Total Products</h3>
            <p className="metric-value">{stats?.counts?.products || 0}</p>
          </div>
        </div>

        <div className="admin-card metric-card">
          <div className="metric-icon">👆</div>
          <div className="metric-info">
            <h3>Interactions</h3>
            <p className="metric-value">{stats?.counts?.interactions || 0}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* Quick Actions */}
        <div className="admin-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions-list">
            <Link className="admin-btn" to="/admin/products">Manage Products</Link>
            <Link className="admin-btn" to="/admin/categories">Manage Categories</Link>
            <Link className="admin-btn" to="/admin/users">Manage Users</Link>
            <Link className="admin-btn admin-btn-ghost" to="/admin/metrics">Recommender Metrics</Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-card activity-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-icon">
                    {activity.action === 'view' && '👀'}
                    {activity.action === 'click' && '🖱️'}
                    {activity.action === 'add_to_cart' && '🛒'}
                    {activity.action === 'purchase' && '💰'}
                  </span>
                  <div className="activity-details">
                    <p>
                      <strong>{activity.userId?.name || 'User'}</strong> {activity.action.replace('_', ' ')}ed
                      <strong> {activity.productId?.name || 'Product'}</strong>
                    </p>
                    <small>{new Date(activity.timestamp).toLocaleString()}</small>
                  </div>
                </div>
              ))
            ) : (
              <p>No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
