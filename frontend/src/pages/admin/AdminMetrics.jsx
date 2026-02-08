import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminPages.css';

export default function AdminMetrics() {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [online, setOnline] = useState(null);
  const [evalRes, setEvalRes] = useState(null);


  const fetchAll = async () => {
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      // 1. Fetch Online Metrics (MongoDB) - Should always succeed if backend is up
      try {
        const onlineR = await axios.get(`${API_URL}/api/recommender/online-metrics`, { params: { days: 7 } });
        setOnline(onlineR.data);
      } catch (err) {
        console.error('Online metrics failed:', err);
        // Don't fail everything, just this part
      }

      // 2. Fetch ML Evaluation (Python Service) - Might fail if ML is down/training
      try {
        const evalR = await axios.get(`${API_URL}/api/recommender/evaluate`, { params: { k: 10 } });
        setEvalRes(evalR.data);
      } catch (err) {
        console.error('ML Evaluation failed:', err);
        if (!online) {
          // Only set global error if we have NOTHING to show
          setError('Metrics partially unavailable. ML Service might be offline.');
        }
      }

    } catch (e) {
      setError('Backend service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const syncML = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API_URL}/api/recommender/sync`);
      setSuccess('Synced latest data to AI engine.');
      await fetchAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const formatPct = (x) => `${(Number(x) * 100).toFixed(1)}%`;

  return (
    <AdminLayout title="Recommender Performance">
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-header-actions">
        <button className="admin-btn primary" onClick={syncML} disabled={syncing}>
          {syncing ? 'Syncing...' : '🔄 Sync Data to AI'}
        </button>
      </div>

      {loading ? <div className="admin-loading">Loading insights...</div> : (
        <>
          {/* Main KPI Cards - Color Coded */}
          <div className="admin-grid">
            <div className="admin-card metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div>
                <h3 className="admin-muted">Click-Through Rate</h3>
                <div className="admin-kpi" style={{ color: '#3b82f6' }}>
                  {formatPct(online?.ctr || 0)}
                </div>
                <div className="admin-muted">Online CTR (7 days)</div>
              </div>
            </div>

            <div className="admin-card metric-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div>
                <h3 className="admin-muted">Interactions</h3>
                <div className="admin-kpi" style={{ color: '#10b981' }}>
                  {online?.clicks || 0}
                </div>
                <div className="admin-muted">Total Clicks Tracked</div>
              </div>
            </div>

            <div className="admin-card metric-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div>
                <h3 className="admin-muted">Total Views</h3>
                <div className="admin-kpi" style={{ color: '#8b5cf6' }}>
                  {online?.views || 0}
                </div>
                <div className="admin-muted">Product Page Views</div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: '30px', textAlign: 'center', padding: '40px' }}>
            <h3 style={{ color: '#64748b' }}>✨ System Healthy</h3>
            <p>Real-time metrics are being tracked. Sync data to improve AI accuracy.</p>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
