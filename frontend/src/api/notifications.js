const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('tungu_token')}`
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error en la petición');
  return data;
};

export const getNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications`, { headers: getHeaders() });
  return handleResponse(response);
};

export const markAsRead = async (id) => {
  const response = await fetch(`${API_URL}/notifications/mark-read/${id}`, {
    method: 'PUT',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const markAllAsRead = async () => {
  const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
    method: 'PUT',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const subscribeToPush = async (subscription) => {
  const response = await fetch(`${API_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(subscription)
  });
  return handleResponse(response);
};
