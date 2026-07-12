import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PendingVerification from './pages/PendingVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Sell from './pages/Sell';
import EditProduct from './pages/EditProduct';
import SellerProfile from './pages/SellerProfile';
import MyProducts from './pages/MyProducts';

import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import LoginPromptModal from './components/LoginPromptModal';
import AccessibilityWidget from './components/AccessibilityWidget';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { isLoginPromptOpen, closeLoginPrompt } = useCart();
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-verification" element={<PendingVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/sell" element={
            <ProtectedRoute>
              <Sell />
            </ProtectedRoute>
          } />
          <Route path="/edit-product/:id" element={
            <ProtectedRoute>
              <EditProduct />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/seller/:id" element={<SellerProfile />} />
          <Route path="/my-products" element={
            <ProtectedRoute>
              <MyProducts />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
      <AccessibilityWidget />
      <LoginPromptModal isOpen={isLoginPromptOpen} onClose={closeLoginPrompt} />
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

