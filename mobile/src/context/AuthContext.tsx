import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

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

  const login = async (userData: any, token: string) => {
    setUser(userData);
    await SecureStore.setItemAsync('tungu_user', JSON.stringify(userData));
    await SecureStore.setItemAsync('tungu_token', token);
  };

  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('tungu_user');
    await SecureStore.deleteItemAsync('tungu_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
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
