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

export const getWalletSummary = async () => {
  const response = await fetch(`${API_URL}/wallet/summary`, { headers: getHeaders() });
  return handleResponse(response);
};

export const getWalletTransactions = async (page = 1, limit = 20) => {
  const response = await fetch(`${API_URL}/wallet/transactions?page=${page}&limit=${limit}`, { headers: getHeaders() });
  return handleResponse(response);
};
