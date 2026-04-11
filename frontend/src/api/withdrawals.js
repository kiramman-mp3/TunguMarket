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

export const getWithdrawals = async () => {
  const response = await fetch(`${API_URL}/withdrawals`, { headers: getHeaders() });
  return handleResponse(response);
};

export const requestWithdrawal = async (amount, bankInfo) => {
  const response = await fetch(`${API_URL}/withdrawals/request`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ amount, bankInfo })
  });
  return handleResponse(response);
};
