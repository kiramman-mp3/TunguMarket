const API_URL = 'http://localhost:5000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('tungu_token')}`
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error en la petición');
  return data;
};

// Seller Bank Accounts
export const getMyBankAccounts = async () => {
  const response = await fetch(`${API_URL}/seller-bank-accounts`, { headers: getHeaders() });
  return handleResponse(response);
};

export const createBankAccount = async (data) => {
  const response = await fetch(`${API_URL}/seller-bank-accounts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

export const updateBankAccount = async (id, data) => {
  const response = await fetch(`${API_URL}/seller-bank-accounts/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

export const setDefaultBankAccount = async (id) => {
  const response = await fetch(`${API_URL}/seller-bank-accounts/${id}/default`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const deleteBankAccount = async (id) => {
  const response = await fetch(`${API_URL}/seller-bank-accounts/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};
