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

export const getAddresses = async () => {
  const response = await fetch(`${API_URL}/addresses`, { headers: getHeaders() });
  return handleResponse(response);
};

export const createAddress = async (addressData) => {
  const response = await fetch(`${API_URL}/addresses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(addressData)
  });
  return handleResponse(response);
};

export const deleteAddress = async (id) => {
  const response = await fetch(`${API_URL}/addresses/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const setDefaultAddress = async (id) => {
  const response = await fetch(`${API_URL}/addresses/${id}/default`, {
    method: 'PUT',
    headers: getHeaders()
  });
  return handleResponse(response);
};
