import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
  return `http://${ip}:5000/api`;
};

export const API_BASE_URL = getBaseUrl();

type AuthErrorType = 'TOKEN_EXPIRED' | 'ACCOUNT_BANNED';
type AuthErrorListener = (type: AuthErrorType) => void;

const authErrorListeners = new Set<AuthErrorListener>();

export const addAuthErrorListener = (listener: AuthErrorListener) => {
  authErrorListeners.add(listener);
  return () => {
    authErrorListeners.delete(listener);
  };
};

const notifyAuthError = (type: AuthErrorType) => {
  authErrorListeners.forEach((listener) => {
    try {
      listener(type);
    } catch (err) {
      console.error('Error executing auth error listener:', err);
    }
  });
};

async function request(path: string, options: RequestInit = {}) {
  const token = await SecureStore.getItemAsync('tungu_token');
  const headers = new Headers(options.headers || {});

  headers.set('X-Client-Type', 'mobile');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If the body is not FormData, set content-type json
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    if (response.status === 401) {
      notifyAuthError('TOKEN_EXPIRED');
    } else if (response.status === 403 && data.error === 'ACCOUNT_BANNED') {
      notifyAuthError('ACCOUNT_BANNED');
    }
    throw new Error(data.error || data.message || 'Error en la solicitud');
  }

  return data;
}

export const client = {
  get: (path: string, options?: RequestInit) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body?: any, options?: RequestInit) =>
    request(path, {
      ...options,
      method: 'POST',
      body: (body instanceof FormData ? body : JSON.stringify(body)) as any,
    }),
  put: (path: string, body?: any, options?: RequestInit) =>
    request(path, {
      ...options,
      method: 'PUT',
      body: (body instanceof FormData ? body : JSON.stringify(body)) as any,
    }),
  patch: (path: string, body?: any, options?: RequestInit) =>
    request(path, {
      ...options,
      method: 'PATCH',
      body: (body instanceof FormData ? body : JSON.stringify(body)) as any,
    }),
  delete: (path: string, options?: RequestInit) => request(path, { ...options, method: 'DELETE' }),
};

export const getIp = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  return debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
};

export const getImageUrl = (url?: string) => {
  if (!url) return '';
  const ip = getIp();
  
  // Replace localhost, 127.0.0.1, or any local network IP (192.168.x.x, 172.x.x.x) with the current IP
  return url
    .replace('localhost', ip)
    .replace('127.0.0.1', ip)
    .replace(/192\.168\.\d+\.\d+/g, ip)
    .replace(/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/g, ip)
    .replace(/10\.\d+\.\d+\.\d+/g, ip);
};
