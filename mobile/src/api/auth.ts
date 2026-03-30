import Constants from 'expo-constants';

const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
  return `http://${ip}:5000/api/auth`;
};

const API_URL = getBaseUrl();

export const registerUser = async (userData: any) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error || 'Failed to register');
  return data;
};

export const loginUser = async (credentials: any) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error || 'Failed to login');
  return data;
};

export const googleLogin = async (idToken: string) => {
  const response = await fetch(`${API_URL}/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error || 'Failed to login with Google');
  return data;
};

export const logoutUser = async (token: string) => {
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  return response.ok;
};

// --- New methods for Module 1 ---

export const verifyEmail = async (email: string, token: string) => {
  const response = await fetch(`${API_URL}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error || 'Failed to verify email');
  return data;
};

export const resendVerification = async (email: string) => {
  const response = await fetch(`${API_URL}/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error || 'Failed to resend');
  return data;
};

export const forgotPassword = async (email: string) => {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error || 'Failed to request reset');
  return data;
};

export const validateResetToken = async (email: string, token: string) => {
  const response = await fetch(`${API_URL}/validate-reset-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error || 'Failed to validate code');
  return data;
};

export const resetPassword = async (email: string, token: string, password: string) => {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, password }),
  });
  const data = await response.json() as any;
  if (!response.ok) throw new Error(data.error || 'Failed to reset password');
  return data;
};
