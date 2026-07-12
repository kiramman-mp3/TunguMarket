const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
const API_URL = `${BASE_URL}/cart`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error en el carrito');
  }
  return data;
};

/**
 * Obtiene el carrito del usuario autenticado
 */
export const getCart = async () => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

/**
 * Agrega un producto al carrito en el servidor
 */
export const addToCartAPI = async (product_id, quantity, price_at_purchase) => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(`${API_URL}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ product_id, quantity, price_at_purchase })
  });
  return handleResponse(response);
};

/**
 * Actualiza la cantidad de un item en el carrito
 */
export const updateCartItemAPI = async (itemId, quantity) => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ quantity })
  });
  return handleResponse(response);
};

/**
 * Elimina un item del carrito
 */
export const removeCartItemAPI = async (itemId) => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

/**
 * Vacía el carrito del usuario
 */
export const clearCartAPI = async () => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(`${API_URL}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
