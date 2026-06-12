import { client } from './client';

// 1. PRODUCTS & CATEGORIES
export const getAllProducts = async (page = 1, limit = 12, categoryId: string | null = null) => {
  if (categoryId) {
    return client.get(`/products/category/${categoryId}?page=${page}&limit=${limit}`);
  }
  return client.get(`/products?page=${page}&limit=${limit}`);
};

export const getFeaturedProducts = async () => {
  return client.get('/products/featured');
};

export const getProductById = async (id: string) => {
  return client.get(`/products/${id}`);
};

export const searchProducts = async (filters: { q?: string; categoryId?: string; minPrice?: string; maxPrice?: string; minRating?: string }, page = 1) => {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.q) params.append('q', filters.q);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  if (filters.minRating) params.append('minRating', filters.minRating);

  return client.get(`/products/search?${params.toString()}`);
};

export const createProduct = async (formData: FormData) => {
  return client.post('/products', formData);
};

export const updateProduct = async (id: string, formData: FormData | object) => {
  return client.put(`/products/${id}`, formData);
};

export const deleteProduct = async (id: string) => {
  return client.delete(`/products/${id}`);
};

export const getSellerProducts = async (sellerId: string, page = 1, limit = 10) => {
  return client.get(`/products/seller/${sellerId}?page=${page}&limit=${limit}`);
};

export const getSellerStats = async () => {
  return client.get('/products/stats/me');
};

export const updateProductStatus = async (id: string, status: string) => {
  return client.patch(`/products/${id}/status`, { status });
};

export const getCategories = async () => {
  return client.get('/categories');
};

// 2. CART
export const getCart = async () => {
  return client.get('/cart');
};

export const addToCartAPI = async (product_id: string, quantity: number, price_at_purchase: number) => {
  return client.post('/cart/items', { product_id, quantity, price_at_purchase });
};

export const updateCartItemAPI = async (itemId: string, quantity: number) => {
  return client.put(`/cart/items/${itemId}`, { quantity });
};

export const removeCartItemAPI = async (itemId: string) => {
  return client.delete(`/cart/items/${itemId}`);
};

export const clearCartAPI = async () => {
  return client.delete('/cart');
};

// 3. ADDRESSES
export const getAddresses = async () => {
  return client.get('/addresses');
};

export const createAddress = async (data: { city: string; main_street: string; secondary_street: string; neighborhood?: string; house_number?: string; postal_code: string }) => {
  return client.post('/addresses', data);
};

export const deleteAddress = async (id: string) => {
  return client.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id: string) => {
  return client.patch(`/addresses/${id}/default`);
};

// 4. ORDERS & SALES
export const getMyOrders = async () => {
  return client.get('/orders');
};

export const getMySales = async () => {
  return client.get('/orders/seller/sales');
};

export const updateSaleStatus = async (itemId: string, status: string) => {
  return client.put(`/orders/seller/status/${itemId}`, { status });
};

export const getOrderDetails = async (id: string) => {
  return client.get(`/orders/${id}`);
};

export const checkout = async (formData: FormData) => {
  return client.post('/orders/checkout', formData);
};

// 5. WALLET & WITHDRAWALS
export const getWalletStats = async () => {
  return client.get('/wallet');
};

export const getWithdrawals = async () => {
  return client.get('/withdrawals');
};

export const createWithdrawal = async (amount: number, bankAccountId: string) => {
  return client.post('/withdrawals', { amount, bank_account_id: bankAccountId });
};

export const getBankAccounts = async () => {
  return client.get('/seller/bank-accounts');
};

export const createBankAccount = async (data: { banco: string; tipo_cuenta: string; numero_cuenta: string; titular: string; cedula_ruc: string; email_titular: string }) => {
  return client.post('/seller/bank-accounts', data);
};

export const setDefaultBankAccount = async (id: string) => {
  return client.patch(`/seller/bank-accounts/${id}/default`);
};

export const deleteBankAccount = async (id: string) => {
  return client.delete(`/seller/bank-accounts/${id}`);
};

// 6. WISHLIST
export const getWishlist = async () => {
  return client.get('/wishlist');
};

export const toggleWishlist = async (productId: string) => {
  return client.post('/wishlist/toggle', { productId, product_id: productId });
};

// 7. REVIEWS
export const createReview = async (productId: string, rating: number, comment: string) => {
  return client.post('/reviews', { product_id: productId, rating, comment });
};

export const getProductReviews = async (productId: string) => {
  return client.get(`/reviews/product/${productId}`);
};

// 8. NOTIFICATIONS
export const getNotifications = async () => {
  return client.get('/notifications');
};

export const markNotificationRead = async (id: string) => {
  return client.put(`/notifications/mark-read/${id}`);
};

export const deleteNotification = async (id: string) => {
  return client.delete(`/notifications/${id}`);
};

// 9. PUBLIC SELLER INFO
export const getSellerInfo = async (id: string) => {
  return client.get(`/users/seller/${id}`);
};

// 10. USER PROFILE EDITING
export const updateProfileName = async (name: string) => {
  return client.put('/users/profile', { name });
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  return client.put('/users/change-password', { currentPassword, newPassword });
};

export const updateAvatar = async (formData: FormData) => {
  return client.post('/users/profile/avatar', formData);
};
