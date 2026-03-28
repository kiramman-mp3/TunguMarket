import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on load
    const storedUser = localStorage.getItem('tungu_user');
    const storedToken = localStorage.getItem('tungu_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('tungu_user', JSON.stringify(userData));
    localStorage.setItem('tungu_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tungu_user');
    localStorage.removeItem('tungu_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
