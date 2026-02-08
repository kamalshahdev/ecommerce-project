import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminPages.css';

const NavItem = ({ to, label }) => {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link to={to} className={`admin-nav-item ${active ? 'active' : ''}`}>
      {label}
    </Link>
  );
};

export default function AdminLayout({ title, actions, children }) {
  const { user } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">S</div>
          <div>
            <div className="admin-brand-title">Sage Studio</div>
            <div className="admin-brand-sub">Admin</div>
          </div>
        </div>

        <div className="admin-user">
          <div className="admin-user-avatar">👤</div>
          <div>
            <div className="admin-user-name">{user?.name || 'Admin'}</div>
            <div className="admin-user-role">{user?.role || 'admin'}</div>
          </div>
        </div>

        <nav className="admin-nav">
          <NavItem to="/admin" label="Dashboard" />
          <NavItem to="/admin/products" label="Products" />
          <NavItem to="/admin/metrics" label="Recommender Metrics" />
          <div className="admin-nav-spacer" />
          <NavItem to="/" label="Back to Store" />
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">{title}</h1>
          </div>
          <div className="admin-actions">{actions}</div>
        </header>

        <div className="admin-content">{children}</div>
      </section>
    </div>
  );
}
