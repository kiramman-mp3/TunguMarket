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

// Seller Withdrawals
export const getMyWithdrawals = async () => {
  const response = await fetch(`${API_URL}/withdrawals/my-withdrawals`, { headers: getHeaders() });
  return handleResponse(response);
};

export const createWithdrawal = async (amount, bankAccountId) => {
  const response = await fetch(`${API_URL}/withdrawals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ monto: amount, bank_account_id: bankAccountId })
  });
  return handleResponse(response);
};

export const getWalletTransactions = async (page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}/wallet/transactions?page=${page}&limit=${limit}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

// Admin Withdrawals
export const getAdminPendingWithdrawals = async () => {
  const response = await fetch(`${API_URL}/withdrawals/admin/pending`, { headers: getHeaders() });
  return handleResponse(response);
};

export const getAdminAllWithdrawals = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('estado', filters.status);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  
  const response = await fetch(`${API_URL}/withdrawals/admin/all?${params}`, {
    headers: getHeaders()
  });
  return handleResponse(response);
};

export const approveWithdrawal = async (id, validationNotes = '') => {
  const response = await fetch(`${API_URL}/withdrawals/${id}/approve`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ validation_notes: validationNotes })
  });
  return handleResponse(response);
};

export const rejectWithdrawal = async (id, reason) => {
  const response = await fetch(`${API_URL}/withdrawals/${id}/reject`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ motivo_rechazo: reason })
  });
  return handleResponse(response);
};

// Legacy support
export const getWithdrawals = async () => {
  return getMyWithdrawals();
};

export const requestWithdrawal = async (amount, bankInfo) => {
  // This is a legacy function - use createWithdrawal instead
  const response = await fetch(`${API_URL}/withdrawals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ monto: amount, bankInfo })
  });
  return handleResponse(response);
};
