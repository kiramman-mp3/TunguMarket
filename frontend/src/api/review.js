const API_URL = `http://${window.location.hostname}:5000/api/reviews`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error en la solicitud');
  }
  return data;
};

export const getProductReviews = async (productId, page = 1, limit = 10) => {
  const response = await fetch(`${API_URL}/product/${productId}?page=${page}&limit=${limit}`);
  return handleResponse(response);
};

export const getProductReviewStats = async (productId) => {
  const response = await fetch(`${API_URL}/product/${productId}/stats`);
  return handleResponse(response);
};

export const createReview = async (reviewData) => {
  const token = localStorage.getItem('tungu_token');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reviewData)
  });
  return handleResponse(response);
};
