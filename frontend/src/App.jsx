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

import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import Cart from './pages/Cart';
import LoginPromptModal from './components/LoginPromptModal';

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
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/edit-product/:id" element={<EditProduct />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </Layout>
      <LoginPromptModal isOpen={isLoginPromptOpen} onClose={closeLoginPrompt} />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

