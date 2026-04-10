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
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverTotalPrice, setServerTotalPrice] = useState(0);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  // Cargar carrito solo si está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadServerCart();
    } else {
      setCartItems([]);
      setServerTotalPrice(0);
    }
  }, [isAuthenticated]);

  const loadServerCart = async () => {
    try {
      setLoading(true);
      const res = await getCart();
      
      // Mapear los items del servidor para que usen 'price' uniformemente
      const mappedItems = (res.cart.items || []).map(item => ({
        ...item,
        price: parseFloat(item.price_at_purchase)
      }));
      
      setCartItems(mappedItems);
      setServerTotalPrice(parseFloat(res.cart.total_price || 0));
    } catch (err) {
      console.error('Error loading cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!isAuthenticated) {
      setIsLoginPromptOpen(true);
      return;
    }

    try {
      setLoading(true);
      const res = await addToCartAPI(product.id, quantity, product.price);
      
      const mappedItems = (res.cart.items || []).map(item => ({
        ...item,
        price: parseFloat(item.price_at_purchase)
      }));
      
      setCartItems(mappedItems);
      setServerTotalPrice(parseFloat(res.cart.total_price || 0));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const res = await removeCartItemAPI(itemId);
      
      const mappedItems = (res.cart.items || []).map(item => ({
        ...item,
        price: parseFloat(item.price_at_purchase)
      }));
      
      setCartItems(mappedItems);
      setServerTotalPrice(parseFloat(res.cart.total_price || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (!isAuthenticated || newQuantity < 1) return;

    try {
      setLoading(true);
      const res = await updateCartItemAPI(itemId, newQuantity);
      
      const mappedItems = (res.cart.items || []).map(item => ({
        ...item,
        price: parseFloat(item.price_at_purchase)
      }));
      
      setCartItems(mappedItems);
      setServerTotalPrice(parseFloat(res.cart.total_price || 0));
    } catch (err) {
      setError(err.message);
      throw err; // Lanzar para que el componente maneje el error de stock
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const res = await clearCartAPI();
      setCartItems([]);
      setServerTotalPrice(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Totales
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      totalItems: totalItemsCount,
      totalPrice: serverTotalPrice,
      loading,
      error,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isLoginPromptOpen,
      closeLoginPrompt: () => setIsLoginPromptOpen(false),
      refreshCart: isAuthenticated ? loadServerCart : () => {}
    }}>
      {children}
    </CartContext.Provider>
  );
};
