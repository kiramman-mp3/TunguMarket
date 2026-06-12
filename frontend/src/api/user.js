const API_URL = `http://${window.location.hostname}:5000/api/users`;

const getHeaders = () => {
  const token = localStorage.getItem('tungu_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Global notification for specific errors
    if (data.error === 'ACCOUNT_BANNED') {
      window.dispatchEvent(new CustomEvent('tungu-auth-error', { detail: 'ACCOUNT_BANNED' }));
    }
    
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
};

export const getSessions = async () => {
  const response = await fetch(`${API_URL}/sessions`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getLogs = async () => {
  const response = await fetch(`${API_URL}/logs`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const deleteSession = async (token) => {
  const response = await fetch(`${API_URL}/sessions/${token}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getAdminUsers = async () => {
  const response = await fetch(`${API_URL}/admin/users`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const updateUserStatus = async (id, isBanned) => {
  const response = await fetch(`${API_URL}/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ isBanned }),
  });
  return handleResponse(response);
};
export const updateSellerProfile = async (data) => {
  const response = await fetch(`${API_URL}/seller-profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};
