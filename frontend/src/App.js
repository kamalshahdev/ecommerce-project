import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import ProductPage from './pages/ProductPage';
import ProductListPage from './pages/ProductListPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage'; // New import
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUsers from './pages/admin/AdminUsers'; // New import
import AdminCategories from './pages/admin/AdminCategories';
import AdminMetrics from './pages/admin/AdminMetrics';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="loader"></div></div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Admin-only route
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="loader"></div></div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/" replace />;
};


// Refactored Navigation to be a proper sub-component to use hooks
const NavigationBar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const [searchTerm, setSearchTerm] = React.useState('');
  const navigate = require('react-router-dom').useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="app-header">
      <div className="container header-content">
        <Link to="/" className="logo">
          <h1>🛍️ Sage Studio</h1>
        </Link>

        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">🔍</button>
        </form>

        <nav className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/shop" className="nav-link">Shop</Link>

          <Link to="/cart" className="nav-link cart-link">
            🛒
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-greeting">
                <span className="user-avatar">👤</span>
                {user?.name}
              </span>
              <div className="dropdown">
                <Link to="/cart" className="dropdown-item">My Cart</Link>
                {isAdmin && <Link to="/admin" className="dropdown-item">Admin Dashboard</Link>}
                <button onClick={logout} className="dropdown-item logout-btn">Logout</button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-auth btn-login">Login</Link>
              <Link to="/register" className="btn-auth btn-register">Sign Up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

function AppContent() {
  const location = require('react-router-dom').useLocation();
  return (
    <div className="App">
      <NavigationBar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/shop" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/products" element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          } />
          <Route path="/admin/metrics" element={
            <AdminRoute>
              <AdminMetrics />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminRoute>
              <AdminCategories />
            </AdminRoute>
          } />
        </Routes>
      </main>

      {!['/login', '/register'].includes(location.pathname) && (
        <footer className="footer-mega">
          <div className="container">
            <div className="footer-top">
              <div className="footer-brand">
                <h2>Sage Studio.</h2>
                <p>Elevating your lifestyle with curated premium essentials. Experience quality that speaks for itself.</p>
                <div className="social-links-minimal">
                  <a href="#instagram">IG</a>
                  <a href="#twitter">TW</a>
                  <a href="#facebook">FB</a>
                </div>
              </div>

              <div className="footer-col">
                <h4>Shop</h4>
                <ul>
                  <li><Link to={`/shop?category=${encodeURIComponent('New Arrivals')}`}>New Arrivals</Link></li>
                  <li><Link to={`/shop?category=${encodeURIComponent('Best Sellers')}`}>Best Sellers</Link></li>
                  <li><Link to={`/shop?category=${encodeURIComponent('Accessories')}`}>Accessories</Link></li>
                  <li><Link to={`/shop?category=${encodeURIComponent('Sale')}`}>Sale</Link></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4>Support</h4>
                <ul>
                  <li><Link to="/faq">FAQ</Link></li>
                  <li><Link to="/shipping">Shipping & Returns</Link></li>
                  <li><Link to="/contact">Contact Us</Link></li>
                  <li><Link to="/privacy">Privacy Policy</Link></li>
                </ul>
              </div>

              <div className="footer-newsletter">
                <h4>Stay in the Loop</h4>
                <p>Subscribe for exclusive drops and early access.</p>
                <form className="newsletter-form-footer">
                  <input type="email" placeholder="email@address.com" />
                  <button type="submit">→</button>
                </form>
              </div>
            </div>

            <div className="footer-bottom-minimal">
              <p>&copy; 2026 Sage Studio Inc. All rights reserved.</p>
              <div className="payment-icons">
                <span>VISA</span>
                <span>MASTERCARD</span>
                <span>AMEX</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;