// pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './CheckoutPage.css';

const CheckoutPage = () => {
    // Alias cartItems to cart to match existing logic
    const { cartItems: cart, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        address: '',
        city: '',
        zip: '',
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    if (cart.length === 0 && !success) {
        return (
            <div className="checkout-empty">
                <h2>Your cart is empty</h2>
                <button onClick={() => navigate('/shop')}>Continue Shopping</button>
            </div>
        );
    }

    // Card validation helpers
    const formatCardNumber = (value) => {
        // Remove non-digits and format with spaces every 4 digits
        const cleaned = value.replace(/\D/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted.substring(0, 19); // Max 16 digits + 3 spaces
    };

    const validateCardNumber = (number) => {
        const cleaned = number.replace(/\s/g, '');
        return /^\d{16}$/.test(cleaned);
    };

    const validateExpiry = (expiry) => {
        if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
        const [month, year] = expiry.split('/').map(Number);
        if (month < 1 || month > 12) return false;
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
        return true;
    };

    const validateCVC = (cvc) => /^\d{3,4}$/.test(cvc);

    const handleChange = (e) => {
        let { name, value } = e.target;

        // Format card number with spaces
        if (name === 'cardNumber') {
            value = formatCardNumber(value);
        }

        // Auto-insert slash for expiry
        if (name === 'expiry') {
            value = value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
        }

        // CVC only digits
        if (name === 'cvc') {
            value = value.replace(/\D/g, '').substring(0, 4);
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validate card details
        if (!validateCardNumber(formData.cardNumber)) {
            setError('Please enter a valid 16-digit card number');
            return;
        }
        if (!validateExpiry(formData.expiry)) {
            setError('Please enter a valid expiry date (MM/YY) that is not expired');
            return;
        }
        if (!validateCVC(formData.cvc)) {
            setError('Please enter a valid 3 or 4 digit CVC');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            };

            const orderData = {
                orderItems: cart.map(item => ({
                    product: item._id || item.product._id,
                    name: item.name,
                    image: item.imageUrl,
                    price: item.price,
                    qty: item.quantity
                })),
                shippingAddress: {
                    address: formData.address,
                    city: formData.city,
                    postalCode: formData.zip,
                    country: 'Pakistan'
                },
                paymentMethod: 'Credit/Debit Card',
                itemsPrice: getCartTotal(),
                taxPrice: 0,
                shippingPrice: getCartTotal() > 5000 ? 0 : 250,
                totalPrice: getCartTotal() + (getCartTotal() > 5000 ? 0 : 250)
            };

            await axios.post(`${API_URL}/api/orders`, orderData, config);

            setLoading(false);
            setSuccess(true);
            clearCart();
        } catch (err) {
            console.error('Order creation failed:', err);
            setError(err.response?.data?.message || 'Payment failed. Please try again.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="checkout-success">
                <div className="success-icon">✓</div>
                <h2>Payment Successful!</h2>
                <p>Thank you for your order. Your order has been placed successfully!</p>
                <button onClick={() => navigate('/shop')} className="home-btn">Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                {/* Steps Indicator */}
                <div className="checkout-header-section">
                    <div className="checkout-steps">
                        <div className="step completed">Cart</div>
                        <div className="step-line filled"></div>
                        <div className="step active">Payment</div>
                        <div className="step-line"></div>
                        <div className="step">Confirmation</div>
                    </div>
                </div>

                <div className="checkout-content-grid">
                    {/* Left Column: Form */}
                    <div className="checkout-form-section">
                        <div className="section-header">
                            <h2>Shipping & Payment</h2>
                            <span className="secure-badge">🔒 Secure SSL Encrypted</span>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <h3>Shipping Information</h3>
                                <div className="input-row">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        required
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Street Address"
                                    value={formData.address}
                                    required
                                    onChange={handleChange}
                                />
                                <div className="input-row">
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={formData.city}
                                        required
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="zip"
                                        placeholder="ZIP Code"
                                        value={formData.zip}
                                        required
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <h3>Payment Method</h3>
                                <div className="card-mock">
                                    <div className="card-logos">
                                        <span>💳 Credit / Debit Card</span>
                                        <div className="logos">
                                            <span className="visa">VISA</span>
                                            <span className="master">MasterCard</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        name="cardName"
                                        placeholder="Name on Card"
                                        required
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        placeholder="Card Number (0000 0000 0000 0000)"
                                        maxLength="19"
                                        value={formData.cardNumber}
                                        required
                                        onChange={handleChange}
                                    />
                                    <div className="input-row">
                                        <input
                                            type="text"
                                            name="expiry"
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            value={formData.expiry}
                                            required
                                            onChange={handleChange}
                                        />
                                        <input
                                            type="text"
                                            name="cvc"
                                            placeholder="CVC"
                                            maxLength="4"
                                            value={formData.cvc}
                                            required
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="pay-btn" disabled={loading}>
                                {loading ? 'Processing...' : `Pay PKR ${getCartTotal().toLocaleString()}`}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="order-summary-section">
                        <h3>Order Summary</h3>
                        <div className="summary-items">
                            {cart.map(item => (
                                <div key={item._id || item.product._id} className="summary-item">
                                    <img src={item.imageUrl} alt={item.name} />
                                    <div className="summary-info">
                                        <h4>{item.name}</h4>
                                        <p>Qty: {item.quantity}</p>
                                        <p className="summary-price">PKR {(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="summary-totals">
                            <div className="total-row"><span>Subtotal</span> <span>PKR {getCartTotal().toLocaleString()}</span></div>
                            <div className="total-row"><span>Shipping</span> <span>{getCartTotal() > 5000 ? 'Free' : 'PKR 250'}</span></div>
                            <div className="total-row final"><span>Total</span> <span>PKR {(getCartTotal() + (getCartTotal() > 5000 ? 0 : 250)).toLocaleString()}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
