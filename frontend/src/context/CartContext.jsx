import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getCart, 
  addToCartAPI, 
  updateCartItemAPI, 
  removeCartItemAPI, 
  clearCartAPI 
} from '../api/cart';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar carrito inicial
  useEffect(() => {
    if (isAuthenticated) {
      loadServerCart();
    } else {
      loadLocalCart();
    }
  }, [isAuthenticated]);

  // Sincronizar carrito local al server tras el login
  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('tungu_guest_cart')) {
      syncLocalCartToServer();
    }
  }, [isAuthenticated]);

  const loadLocalCart = () => {
    const savedCart = localStorage.getItem('tungu_guest_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  };

  const loadServerCart = async () => {
    try {
      setLoading(true);
      const res = await getCart();
      // El backend devuelve cart.items
      setCartItems(res.cart.items || []);
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncLocalCartToServer = async () => {
    const localCart = JSON.parse(localStorage.getItem('tungu_guest_cart') || '[]');
    if (localCart.length === 0) return;

    try {
      setLoading(true);
      // Agregar cada item local al servidor
      for (const item of localCart) {
        await addToCartAPI(item.product_id, item.quantity, item.price);
      }
      // Limpiar local y recargar server
      localStorage.removeItem('tungu_guest_cart');
      await loadServerCart();
    } catch (err) {
      console.error('Error syncing cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await addToCartAPI(product.id, quantity, product.price);
        setCartItems(res.cart.items);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    } else {
      // Lógica Local
      const prevCart = [...cartItems];
      const existingItem = prevCart.find(item => item.product_id === product.id);
      
      let newCart;
      if (existingItem) {
        newCart = prevCart.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prevCart, {
          product_id: product.id,
          title: product.title,
          price: product.price,
          image_url: product.primary_image || product.image_url,
          quantity: quantity
        }];
      }
      
      setCartItems(newCart);
      localStorage.setItem('tungu_guest_cart', JSON.stringify(newCart));
    }
  };

  const removeFromCart = async (itemId, productId) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await removeCartItemAPI(itemId);
        setCartItems(res.cart.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      const newCart = cartItems.filter(item => item.product_id !== productId);
      setCartItems(newCart);
      localStorage.setItem('tungu_guest_cart', JSON.stringify(newCart));
    }
  };

  const updateQuantity = async (itemId, productId, newQuantity) => {
    if (newQuantity < 1) return;

    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await updateCartItemAPI(itemId, newQuantity);
        setCartItems(res.cart.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      const newCart = cartItems.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCartItems(newCart);
      localStorage.setItem('tungu_guest_cart', JSON.stringify(newCart));
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await clearCartAPI();
        setCartItems(res.cart.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setCartItems([]);
      localStorage.removeItem('tungu_guest_cart');
    }
  };

  // Totales
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      totalItems,
      totalPrice,
      loading,
      error,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      refreshCart: isAuthenticated ? loadServerCart : loadLocalCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
