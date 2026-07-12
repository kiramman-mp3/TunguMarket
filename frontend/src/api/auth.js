const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
const API_URL = `${BASE_URL}/auth`;

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    if (data.error === 'ACCOUNT_BANNED') {
      window.dispatchEvent(new CustomEvent('tungu-auth-error', { detail: 'ACCOUNT_BANNED' }));
    }
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};



export const logoutUser = async (token) => {
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  return response.ok;
};

export const verifyEmail = async (email, token) => {
  const response = await fetch(`${API_URL}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  });
  return handleResponse(response);
};

export const resendVerification = async (email) => {
  const response = await fetch(`${API_URL}/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
};

export const forgotPassword = async (email) => {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
};

export const validateResetToken = async (email, token) => {
  const response = await fetch(`${API_URL}/validate-reset-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token }),
  });
  return handleResponse(response);
};

export const resetPassword = async (email, token, password) => {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, password }),
  });
  return handleResponse(response);
};
