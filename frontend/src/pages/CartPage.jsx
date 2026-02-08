// pages/CartPage.jsx - Receipt Style
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
    const { cartItems: cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const navigate = useNavigate();

    const subtotal = getCartTotal();
    const shipping = subtotal > 5000 ? 0 : 250;
    const total = subtotal + shipping;
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (cart.length === 0) {
        return (
            <div className="cart-page-receipt">
                <div className="empty-cart-message">
                    <h2>Your Bag is Empty</h2>
                    <Link to="/shop" className="checkout-btn-receipt" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page-receipt">
            <div className="receipt-container">

                {/* Product List */}
                <div className="cart-items-section">
                    <div className="cart-header-minimal">
                        <h1>Shopping Bag</h1>
                        <span className="cart-count">[{cart.length} ITEMS]</span>
                    </div>

                    {cart.map(item => (
                        <div key={item._id} className="cart-item-receipt">
                            <div className="item-visual">
                                <img src={item.imageUrl} alt={item.name} />
                            </div>
                            <div className="item-details-receipt">
                                <Link to={`/products/${item._id}`} className="item-name">
                                    {item.name}
                                </Link>
                                <div className="item-meta">
                                    SKU: {item._id.substring(0, 6).toUpperCase()}
                                </div>
                                <div className="item-actions-receipt">
                                    <div className="receipt-qty">
                                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                                    </div>
                                    <div className="item-price-receipt">
                                        PKR {(item.price * item.quantity).toLocaleString()}
                                    </div>
                                </div>
                                <button className="item-remove" onClick={() => removeFromCart(item._id)}>Remove</button>
                            </div>
                        </div>
                    ))}
                    <button onClick={clearCart} style={{ marginTop: '20px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Clear All</button>
                </div>

                {/* Receipt Summary */}
                <div className="receipt-summary-paper">
                    <div className="summary-header">
                        <h3>Order Summary</h3>
                        <span className="date-stamp">{date}</span>
                    </div>

                    <div className="summary-rows">
                        <div className="row">
                            <span>Subtotal</span>
                            <span>PKR {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="row">
                            <span>Shipping</span>
                            <span>{shipping === 0 ? 'FREE' : `PKR ${shipping}`}</span>
                        </div>
                        <div className="row">
                            <span>Tax (Included)</span>
                            <span>PKR 0</span>
                        </div>
                        <div className="row total">
                            <span>TOTAL</span>
                            <span>PKR {total.toLocaleString()}</span>
                        </div>
                    </div>

                    <button className="checkout-btn-receipt" onClick={() => navigate('/checkout')}>
                        Proceed to Checkout
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '15px', fontFamily: 'Courier New', fontSize: '12px', color: '#999' }}>
                        THANK YOU FOR SHOPPING WITH US
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CartPage;
