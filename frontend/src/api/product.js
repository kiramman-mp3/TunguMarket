const API_URL = `http://${window.location.hostname}:5000/api/products`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error en la solicitud');
  }
  return data;
};

/**
 * Obtiene todos los productos con paginación y filtros opcionales
 */
export const getAllProducts = async (page = 1, limit = 12, categoryId = null) => {
  let url = `${API_URL}?page=${page}&limit=${limit}`;
  if (categoryId) url += `&categoryId=${categoryId}`;
  
  const response = await fetch(url);
  return handleResponse(response);
};

/**
 * Obtiene los productos destacados para la página de inicio
 */
export const getFeaturedProducts = async () => {
  const response = await fetch(`${API_URL}/featured`);
  return handleResponse(response);
};

/**
 * Obtiene los detalles completos de un producto por su ID
 */
export const getProductById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);
  return handleResponse(response);
};

/**
 * Realiza una búsqueda de productos por texto
 */
export const searchProducts = async (query, page = 1) => {
  const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}`);
  return handleResponse(response);
};

/**
 * Obtiene productos filtrados por categoría
 */
export const getProductsByCategory = async (categoryId, page = 1) => {
  const response = await fetch(`${API_URL}/category/${categoryId}?page=${page}`);
  return handleResponse(response);
};
