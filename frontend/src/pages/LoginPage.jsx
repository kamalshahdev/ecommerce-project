// pages/LoginPage.jsx - Editorial Design
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthEditorial.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Inavlid credentials. Please try again.');
    }
  };

  return (
    <div className="auth-editorial">
      {/* Left Side - The Kinetic Art */}
      <div className="auth-visual">
        <div className="visual-card-float card-main">
          <img src="https://images.unsplash.com/photo-1617137968427-85924c809a10?auto=format&fit=crop&w=800&q=80" alt="Login Main" />
        </div>
        <div className="visual-card-float card-accent">
          <img src="https://images.unsplash.com/photo-1506634572416-48cdfe530110?auto=format&fit=crop&w=800&q=80" alt="Login Accent" />
        </div>


      </div>

      {/* Right Side - The Form */}
      <div className="auth-form-container">
        <div className="form-wrapper">


          <h1><span className="highlight-text">Welcome Back</span></h1>
          <p className="subtitle">Please enter your details to sign in.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group-minimal">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="input-group-minimal">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-auth-editorial">Sign In</button>
            </div>

            <div className="form-footer">
              <p>Don't have an account? <Link to="/register">Create one</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;