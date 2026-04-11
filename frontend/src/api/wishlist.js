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

export const getWishlist = async () => {
  const response = await fetch(`${API_URL}/wishlist`, { headers: getHeaders() });
  return handleResponse(response);
};

export const toggleWishlist = async (productId) => {
  const response = await fetch(`${API_URL}/wishlist/toggle`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ productId })
  });
  return handleResponse(response);
};
