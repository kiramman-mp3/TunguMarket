import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import EventSource from 'react-native-sse';
import Constants from 'expo-constants';
import BanModal from '../components/BanModal';
import { addAuthErrorListener } from '../api/client';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (userData: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBanModal, setShowBanModal] = useState(false);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('tungu_user');
        const storedToken = await SecureStore.getItemAsync('tungu_token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to load auth data', e);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  // Subscribe to global auth error events from the client
  useEffect(() => {
    const removeListener = addAuthErrorListener((type) => {
      if (type === 'TOKEN_EXPIRED') {
        console.log('[AuthContext Mobile] Auth token expired or invalid, logging out...');
        logout();
      } else if (type === 'ACCOUNT_BANNED') {
        console.log('[AuthContext Mobile] Account banned detected...');
        setShowBanModal(true);
      }
    });

    return () => {
      removeListener();
    };
  }, []);

  // Real-time notifications connection (SSE) for Mobile
  useEffect(() => {
    let es: EventSource | null = null;

    const connectSSE = async () => {
      const token = await SecureStore.getItemAsync('tungu_token');
      if (user && token) {
        const debuggerHost = Constants.expoConfig?.hostUri;
        const ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
        const url = `http://${ip}:5000/api/notifications/stream?token=${token}`;

        console.log('[SSE Mobile] Connecting to:', url);
        es = new EventSource(url);

        es.addEventListener('message', (event: any) => {
          if (event.data) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'ACCOUNT_BANNED') {
                setShowBanModal(true);
              }
            } catch (err) {
              console.error('[SSE Mobile] Error parsing message:', err);
            }
          }
        });

        es.addEventListener('error', (event: any) => {
          console.error('[SSE Mobile] Connection error:', event.message);
          if (event.message) {
            try {
              const errData = JSON.parse(event.message);
              if (errData.error === 'Invalid notification token' || errData.message === 'Invalid notification token') {
                console.log('[SSE Mobile] Invalid notification token detected, logging out...');
                logout();
              }
            } catch (e) {
              if (event.message.includes('Invalid notification token')) {
                console.log('[SSE Mobile] Invalid notification token string detected, logging out...');
                logout();
              }
            }
          }
        });
      }
    };

    connectSSE();

    return () => {
      if (es) {
        console.log('[SSE Mobile] Closing stream...');
        es.close();
      }
    };
  }, [user]);

  const login = async (userData: any, token: string) => {
    // RESTRICTION: Admins cannot login on Mobile
    if (userData.role_name === 'admin') {
      throw new Error('El acceso administrativo solo está disponible en la versión web.');
    }

    await SecureStore.setItemAsync('tungu_user', JSON.stringify(userData));
    await SecureStore.setItemAsync('tungu_token', token);
    setUser(userData);
  };

  const logout = async () => {
    setUser(null);
    setShowBanModal(false);
    await SecureStore.deleteItemAsync('tungu_user');
    await SecureStore.deleteItemAsync('tungu_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
      <BanModal isOpen={showBanModal} onClose={logout} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
