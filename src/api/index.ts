import client from './client';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Address,
  Category,
  Product,
  Cart,
  Order,
  Review,
  Store,
  PaginatedResponse,
} from '../types';

// ── Auth ──
export const authApi = {
  login: (data: LoginRequest) =>
    client.post<ApiResponse<AuthResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    client.post<ApiResponse<AuthResponse>>('/auth/register', data),

  refresh: () => client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  logout: () => client.post<ApiResponse<null>>('/auth/logout'),

  forgotPassword: (data: { email: string }) =>
    client.post<ApiResponse<null>>('/auth/forgot-password', data),
};

// ── User / Profile ──
export const userApi = {
  getProfile: () => client.get<ApiResponse<User>>('/users/profile'),

  updateProfile: (data: Partial<User>) =>
    client.put<ApiResponse<User>>('/users/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    client.put<ApiResponse<null>>('/users/change-password', { currentPassword, newPassword }),

  getAddresses: () => client.get<ApiResponse<Address[]>>('/users/addresses'),

  addAddress: (data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    client.post<ApiResponse<Address>>('/users/addresses', data),

  updateAddress: (id: string, data: Partial<Address>) =>
    client.put<ApiResponse<Address>>(`/users/addresses/${id}`, data),

  deleteAddress: (id: string) =>
    client.delete<ApiResponse<null>>(`/users/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    client.put<ApiResponse<null>>(`/users/addresses/${id}/default`),
};

// ── Categories ──
export const categoryApi = {
  list: () => client.get<ApiResponse<Category[]>>('/categories'),

  popular: () => client.get<ApiResponse<Category[]>>('/categories/popular'),
};

// ── Products ──
export const productApi = {
  list: (params?: Record<string, any>) =>
    client.get<ApiResponse<PaginatedResponse<Product>>>('/products', { params }),

  trending: (lat?: number, lng?: number) =>
    client.get<ApiResponse<Product[]>>('/products/trending', { params: { ...(lat !== undefined && { lat, lng }) } }),

  featured: (lat?: number, lng?: number) =>
    client.get<ApiResponse<Product[]>>('/products/featured', { params: { ...(lat !== undefined && { lat, lng }) } }),

  search: (q: string) =>
    client.get<ApiResponse<Product[]>>('/products/search', { params: { q } }),

  getBySlug: (slug: string, lat?: number, lng?: number) =>
    client.get<ApiResponse<Product>>(`/products/${slug}`, { params: { ...(lat !== undefined && { lat, lng }) } }),

  checkStock: (productIds: string[]) =>
    client.post<ApiResponse<Record<string, { stock: number; isAvailable: boolean }>>>('/products/stock', { productIds }),
};

// ── Cart ──
export const cartApi = {
  get: () => client.get<ApiResponse<Cart>>('/cart'),

  addItem: (productId: string, quantity: number = 1, lat?: number, lng?: number) =>
    client.post<ApiResponse<Cart>>('/cart/items', { productId, quantity, ...(lat !== undefined && { lat, lng }) }),

  updateItem: (productId: string, quantity: number) =>
    client.put<ApiResponse<Cart>>(`/cart/items/${productId}`, { quantity }),

  removeItem: (productId: string) =>
    client.delete<ApiResponse<Cart>>(`/cart/items/${productId}`),

  clear: () => client.delete<ApiResponse<null>>('/cart'),

  applyCoupon: (code: string) =>
    client.post<ApiResponse<any>>('/cart/coupon', { code }),
};

// ── Orders ──
export const orderApi = {
  create: (data: { addressId: string; paymentMethod: string; couponCode?: string; notes?: string }) =>
    client.post<ApiResponse<Order>>('/orders', data),

  list: (params?: Record<string, any>) =>
    client.get<ApiResponse<PaginatedResponse<Order>>>('/orders', { params }),

  getById: (id: string) => client.get<ApiResponse<Order>>(`/orders/${id}`),

  cancel: (id: string, reason?: string) =>
    client.put<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason }),

  reorderPreview: (id: string) =>
    client.get<ApiResponse<any>>(`/orders/${id}/reorder`),
};

// ── Reviews ──
export const reviewApi = {
  list: (slug: string, params?: Record<string, any>) =>
    client.get<ApiResponse<PaginatedResponse<Review>>>(`/products/${slug}/reviews`, { params }),

  create: (data: { productId: string; rating: number; title?: string; comment?: string }) =>
    client.post<ApiResponse<Review>>('/reviews', data),

  update: (id: string, data: { rating?: number; title?: string; comment?: string }) =>
    client.put<ApiResponse<Review>>(`/reviews/${id}`, data),

  delete: (id: string) => client.delete<ApiResponse<null>>(`/reviews/${id}`),
};

// ── Stores ──
export const storeApi = {
  nearby: (lat: number, lng: number) =>
    client.get<ApiResponse<Store[]>>('/stores/nearby', { params: { lat, lng } }),

  list: () => client.get<ApiResponse<Store[]>>('/stores'),
};

// ── Wishlist ──
export const wishlistApi = {
  get: () => client.get<ApiResponse<any[]>>('/wishlist'),

  toggle: (productId: string) =>
    client.post<ApiResponse<{ inWishlist: boolean }>>('/wishlist/toggle', { productId }),

  check: (productIds: string[]) =>
    client.post<ApiResponse<Record<string, boolean>>>('/wishlist/check', { productIds }),

  remove: (productId: string) =>
    client.delete<ApiResponse<null>>(`/wishlist/${productId}`),
};
