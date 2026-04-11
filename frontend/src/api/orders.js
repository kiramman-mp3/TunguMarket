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

export const getMyOrders = async () => {
  const response = await fetch(`${API_URL}/orders`, { headers: getHeaders() });
  return handleResponse(response);
};

export const getMySales = async () => {
  const response = await fetch(`${API_URL}/orders/seller/sales`, { headers: getHeaders() });
  return handleResponse(response);
};

export const updateSaleStatus = async (itemId, status) => {
  const response = await fetch(`${API_URL}/orders/seller/status/${itemId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  return handleResponse(response);
};

export const getOrderDetails = async (id) => {
  const response = await fetch(`${API_URL}/orders/${id}`, { headers: getHeaders() });
  return handleResponse(response);
};
