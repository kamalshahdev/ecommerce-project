// context/CartContext.js - Cart State Management
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Determine storage key based on user
    const getStorageKey = useCallback(() => {
        return user ? `cart_${user._id}` : 'cart_guest';
    }, [user]);

    // Load cart when user changes or on mount
    useEffect(() => {
        setLoading(true);
        try {
            const key = getStorageKey();
            const savedCart = localStorage.getItem(key);
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            } else {
                setCartItems([]);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, [user]); // Re-run when user changes

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (!loading) {
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(cartItems));
        }
    }, [cartItems, loading, user]);

    // Add item to cart
    const addToCart = (product, quantity = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item._id === product._id);

            if (existingItem) {
                // Update quantity if item already exists
                return prevItems.map(item =>
                    item._id === product._id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                return [...prevItems, { ...product, quantity }];
            }
        });
    };

    // Remove item from cart
    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
    };

    // Update item quantity
    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item =>
                item._id === productId ? { ...item, quantity } : item
            )
        );
    };

    // Clear entire cart
    const clearCart = () => {
        setCartItems([]);
        const key = getStorageKey();
        localStorage.removeItem(key);
    };

    // Get total items count
    const getCartCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    // Get cart total price
    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    // Check if item is in cart
    const isInCart = (productId) => {
        return cartItems.some(item => item._id === productId);
    };

    // Get item quantity in cart
    const getItemQuantity = (productId) => {
        const item = cartItems.find(item => item._id === productId);
        return item ? item.quantity : 0;
    };

    const value = {
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getCartTotal,
        isInCart,
        getItemQuantity
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
