import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getCart,
  addToCartAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI,
} from '../api/endpoints';

interface CartItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  price_at_purchase: string;
  quantity: number;
  image_url?: string;
  stock?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  error: string | null;
  addToCart: (product: { id: string; price: number }, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadServerCart();
    } else {
      setCartItems([]);
      setTotalPrice(0);
    }
  }, [isAuthenticated]);

  const loadServerCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCart();
      const items = (res.cart.items || []).map((item: any) => ({
        ...item,
        price: parseFloat(item.price_at_purchase),
      }));
      setCartItems(items);
      setTotalPrice(parseFloat(res.cart.total_price || 0));
    } catch (err: any) {
      console.error('[CartContext Mobile] Error loading cart:', err);
      setError(err.message || 'Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: { id: string; price: number }, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para agregar al carrito');
    }
    try {
      setLoading(true);
      setError(null);
      const res = await addToCartAPI(product.id, quantity, product.price);
      const items = (res.cart.items || []).map((item: any) => ({
        ...item,
        price: parseFloat(item.price_at_purchase),
      }));
      setCartItems(items);
      setTotalPrice(parseFloat(res.cart.total_price || 0));
    } catch (err: any) {
      setError(err.message || 'Error al agregar al carrito');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const res = await removeCartItemAPI(itemId);
      const items = (res.cart.items || []).map((item: any) => ({
        ...item,
        price: parseFloat(item.price_at_purchase),
      }));
      setCartItems(items);
      setTotalPrice(parseFloat(res.cart.total_price || 0));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar del carrito');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (!isAuthenticated || newQuantity < 1) return;
    try {
      setLoading(true);
      setError(null);
      const res = await updateCartItemAPI(itemId, newQuantity);
      const items = (res.cart.items || []).map((item: any) => ({
        ...item,
        price: parseFloat(item.price_at_purchase),
      }));
      setCartItems(items);
      setTotalPrice(parseFloat(res.cart.total_price || 0));
    } catch (err: any) {
      setError(err.message || 'Error al actualizar cantidad');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      await clearCartAPI();
      setCartItems([]);
      setTotalPrice(0);
    } catch (err: any) {
      setError(err.message || 'Error al vaciar el carrito');
    } finally {
      setLoading(false);
    }
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems: totalItemsCount,
        totalPrice,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: loadServerCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
