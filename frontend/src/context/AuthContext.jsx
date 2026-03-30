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

    // Global listener for critical auth errors (like being banned)
    const handleAuthError = (event) => {
      if (event.detail === 'ACCOUNT_BANNED') {
        alert('Tu cuenta ha sido baneada, se cerrará la sesión.');
        logout();
      }
    };
    window.addEventListener('tungu-auth-error', handleAuthError);
    return () => window.removeEventListener('tungu-auth-error', handleAuthError);
  }, []);

  // Real-time notifications connection (SSE)
  useEffect(() => {
    let eventSource = null;
    const token = localStorage.getItem('tungu_token');

    if (user && token) {
      console.log('[SSE] Connecting to notification stream...');
      eventSource = new EventSource(`http://localhost:5000/api/notifications/stream?token=${token}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ACCOUNT_BANNED') {
            alert('🚨 Tu cuenta ha sido baneada. La sesión se cerrará inmediatamente.');
            logout();
          }
        } catch (err) {
          console.error('[SSE] Error parsing message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[SSE] Connection error:', err);
        // EventSource automatically retries by default
      };
    }

    return () => {
      if (eventSource) {
        console.log('[SSE] Closing notification stream...');
        eventSource.close();
      }
    };
  }, [user]);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('tungu_user', JSON.stringify(userData));
    localStorage.setItem('tungu_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tungu_user');
    localStorage.removeItem('tungu_token');
    window.location.href = '/login'; // Force redirect to login
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
