const BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
const API_URL = `${BASE_URL}/categories`;

export const getCategories = async () => {
  const response = await fetch(API_URL);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener categorías');
  return data;
};
