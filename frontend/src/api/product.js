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
 * Realiza una búsqueda de productos con filtros combinados
 */
export const searchProducts = async (filtersObj, page = 1) => {
  const params = new URLSearchParams({ page });
  
  if (filtersObj.q) params.append('q', filtersObj.q);
  if (filtersObj.categoryId) params.append('categoryId', filtersObj.categoryId);
  if (filtersObj.minPrice) params.append('minPrice', filtersObj.minPrice);
  if (filtersObj.maxPrice) params.append('maxPrice', filtersObj.maxPrice);
  if (filtersObj.minRating) params.append('minRating', filtersObj.minRating);

  const response = await fetch(`${API_URL}/search?${params.toString()}`);
  return handleResponse(response);
};

/**
 * Obtiene productos filtrados por categoría
 */
export const getProductsByCategory = async (categoryId, page = 1) => {
  const response = await fetch(`${API_URL}/category/${categoryId}?page=${page}`);
  return handleResponse(response);
};
/**
 * Crea un nuevo producto (requiere autenticación)
 * @param {FormData} productFormData - Datos del producto y archivo de imagen
 */
export const createProduct = async (productFormData) => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: productFormData
  });
  return handleResponse(response);
};
/**
 * Actualiza un producto existente (requiere ser dueño o admin)
 * @param {string} id - ID del producto
 * @param {FormData|object} productData - Nuevos datos (FormData si hay imagen, objeto si no)
 */
export const updateProduct = async (id, productData) => {
  const token = localStorage.getItem('tungu_token');
  const isFormData = productData instanceof FormData;
  
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' })
    },
    body: isFormData ? productData : JSON.stringify(productData)
  });
  return handleResponse(response);
};

/**
 * Elimina un producto (requiere ser dueño o admin)
 * @param {string} id - ID del producto
 */
export const deleteProduct = async (id) => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
/**
 * Obtiene todas las imágenes de un producto
 */
export const getProductImages = async (productId) => {
  const response = await fetch(`${API_URL}/${productId}/images`);
  return handleResponse(response);
};

/**
 * Elimina una imagen específica de un producto
 */
export const deleteProductImage = async (productId, imageId) => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(`${API_URL}/${productId}/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

/**
 * Establece una imagen como principal
 */
export const setProductPrimaryImage = async (productId, imageId) => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(`${API_URL}/${productId}/images/${imageId}/primary`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

/**
 * Obtiene los productos de un vendedor específico
 */
export const getSellerProducts = async (sellerId, page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}/seller/${sellerId}?page=${page}&limit=${limit}`);
  return handleResponse(response);
};

/**
 * Obtiene estadísticas reales del vendedor actual
 */
export const getSellerStats = async () => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(`${API_URL}/stats/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
