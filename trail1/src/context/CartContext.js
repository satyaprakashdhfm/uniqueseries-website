import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
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
  const [cartTotals, setCartTotals] = useState({
    subtotal: 0,
    gst: 0,
    shipping: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) return;
    console.log('Fetching cart...');
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      console.log('Cart data received:', data);
      // Normalize items so UI can read top-level name/price/w_days
      const normalized = Array.isArray(data) ? data.map((item) => {
        const p = item?.Product || {};
        // Derive a human-friendly name when possible
        let displayName = p.name || item.productName || 'Item';
        // Pretty name for currency notes like "100_rupees_note" -> "₹100 Currency Note"
        if (typeof displayName === 'string' && displayName.includes('_rupees_note')) {
          const num = displayName.split('_')[0];
          displayName = `₹${num} Currency Note`;
        } else if (typeof displayName === 'string') {
          const lower = displayName.toLowerCase();
          if (lower.includes('small') && lower.includes('photo') && lower.includes('frame')) displayName = 'Small Photo Frame';
          if ((lower.startsWith('big') || lower.includes('large')) && lower.includes('frame')) displayName = 'Large Photo Frame';
        }
        return {
          ...item,
          name: item.name ?? displayName,
          price: item.price ?? (p.price != null ? Number(p.price) : 0),
          w_days: item.w_days ?? (p.w_days ?? 5)
        };
      }) : [];
      setCartItems(normalized);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    calculateCartTotals();
  }, [cartItems]);

  const calculateCartTotals = () => {
    if (cartItems.length === 0) {
        setCartTotals({ subtotal: 0, gst: 0, shipping: 0, total: 0 });
        return;
    }
    const subtotal = cartItems.reduce((sum, item) => {
      const unit = (item.price != null ? Number(item.price) : (item.Product?.price != null ? Number(item.Product.price) : 0));
      return sum + unit * (item.quantity || 1);
    }, 0);
    const gst = 0; // No GST
    const shipping = subtotal > 999 ? 0 : 68;
    const total = subtotal + shipping;
    
    setCartTotals({
      subtotal,
      gst,
      shipping,
      total
    });
  };

  const addToCart = async (product, quantity = 1, customization = {}) => {
    console.log('Adding to cart:', { product, quantity, customization });
    try {
      // Backend expects productName to be the Product PK (use exact DB name returned by API)
      const productName = product?.id || product?.name;
      await api.post('/cart', { productName, quantity, customization });
      console.log('Item added to cart, refetching cart...');
      fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (cartItemId) => {
    console.log('Removing from cart:', cartItemId);
    try {
      await api.delete(`/cart/${cartItemId}`);
      console.log('Item removed from cart, refetching cart...');
      fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    console.log('Updating quantity:', { cartItemId, newQuantity });
    try {
      await api.put(`/cart/${cartItemId}`, { quantity: newQuantity });
      console.log('Quantity updated, refetching cart...');
      fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    console.log('Clearing cart...');
    try {
      await api.delete('/cart');
      console.log('Cart cleared, refetching cart...');
      fetchCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const checkStockAvailability = async () => {
    return { 
      allItemsAvailable: true, 
      items: cartItems.map(item => ({
        productId: item.id,
        available: true,
        requestedQuantity: item.quantity || 1,
        availableQuantity: 999
      }))
    };
  };

  const value = {
    cartItems,
    cartTotals,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemsCount,
    checkStockAvailability,
    calculateCartTotals
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};