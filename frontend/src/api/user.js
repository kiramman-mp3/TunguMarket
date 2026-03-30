const API_URL = 'http://localhost:5000/api/users';

const getHeaders = () => {
  const token = localStorage.getItem('tungu_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const getSessions = async () => {
  const response = await fetch(`${API_URL}/sessions`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch sessions');
  return data;
};

export const getLogs = async () => {
  const response = await fetch(`${API_URL}/logs`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch logs');
  return data;
};

export const deleteSession = async (token) => {
  const response = await fetch(`${API_URL}/sessions/${token}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete session');
  return data;
};

export const getAdminUsers = async () => {
  const response = await fetch(`${API_URL}/admin/users`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
  return data;
};

export const updateUserStatus = async (id, isBanned) => {
  const response = await fetch(`${API_URL}/admin/users/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ isBanned }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update user status');
  return data;
};
