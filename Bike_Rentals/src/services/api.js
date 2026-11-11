import { Platform } from 'react-native';

// Deployed production backend URL (Render)
const PRODUCTION_BACKEND_URL = 'https://bike-rentals1.onrender.com';

// Dynamic backend URL resolution supporting Expo, Vite, Vercel, and local dev
const resolveBackendUrl = () => {
  // 1. Direct Expo public environment variables (statically inlined by Metro bundler at build time)
  const expoBackend = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;
  if (expoBackend && typeof expoBackend === 'string' && expoBackend.trim().length > 0) {
    return expoBackend.trim();
  }

  // 2. Direct Vite / Metro environment variables (if inlined by bundler)
  try {
    const viteEnv =
      (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_BACKEND_URL) ||
      process.env.VITE_BACKEND_URL;
    if (viteEnv && typeof viteEnv === 'string' && viteEnv.trim().length > 0) {
      return viteEnv.trim();
    }
  } catch (e) {}

  // 3. Web runtime environment detection: If running in production (e.g., bikeagle.vercel.app or any remote host),
  // NEVER attempt to connect to localhost:5000 — always use the deployed Render backend.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || '';
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local');

    if (!isLocalhost && hostname.length > 0) {
      return PRODUCTION_BACKEND_URL;
    }
  }

  // 4. Fallback for Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  // 5. Fallback for local web development
  return 'http://localhost:5000';
};

// Root Backend URL (e.g., https://bike-rentals1.onrender.com or http://localhost:5000)
export const BACKEND_URL = (() => {
  const raw = resolveBackendUrl();
  return raw.replace(/\/+$/, '');
})();

// API Base URL (always pointing to the /api/v1 prefix, avoiding double slashes)
export const API_BASE_URL = (() => {
  if (BACKEND_URL.endsWith('/api/v1')) {
    return BACKEND_URL;
  }
  if (BACKEND_URL.endsWith('/api')) {
    return `${BACKEND_URL}/v1`;
  }
  return `${BACKEND_URL}/api/v1`;
})();

let inMemoryToken = null;

export const authStorage = {
  getToken: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('bike_token') || inMemoryToken;
    }
    return inMemoryToken;
  },
  setToken: (token) => {
    inMemoryToken = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem('bike_token', token);
      } else {
        window.localStorage.removeItem('bike_token');
      }
    }
  },
  getUser: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const u = window.localStorage.getItem('bike_user');
      return u ? JSON.parse(u) : null;
    }
    return null;
  },
  setUser: (user) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (user) {
        window.localStorage.setItem('bike_user', JSON.stringify(user));
      } else {
        window.localStorage.removeItem('bike_user');
      }
    }
  },
  clear: () => {
    inMemoryToken = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('bike_token');
      window.localStorage.removeItem('bike_user');
    }
  },
};

/**
 * Core HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  // Guarantee clean joining of base URL and endpoint without double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const url = `${cleanBase}${cleanEndpoint}`;
  const token = authStorage.getToken();

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.warn(`[API] Error on ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
}

// 1. Authentication APIs
export const authAPI = {
  sendOtp: (email, purpose = 'LOGIN') =>
    request('/auth/email-otp/send', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),

  verifyOtp: (payload) =>
    request('/auth/email-otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  googleAuth: (payload) =>
    request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  checkUser: (identifier) => {
    const isEmail = typeof identifier === 'string' && identifier.includes('@');
    const param = isEmail ? `email=${encodeURIComponent(identifier)}` : `userId=${encodeURIComponent(identifier)}`;
    return request(`/auth/check-user?${param}`);
  },

  getUserById: (id) => request(`/auth/user/${encodeURIComponent(id)}`),

  getMe: () => request('/auth/me'),

  logout: () => {
    authStorage.clear();
    return Promise.resolve({ success: true });
  },
};

// 2. Bikes & Fleet APIs
export const bikesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/bikes${query ? `?${query}` : ''}`);
  },

  getById: (id) => request(`/bikes/${id}`),

  createListing: (data) =>
    request('/bikes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/bikes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// 3. Bookings & Quotation APIs
export const bookingsAPI = {
  getQuote: (payload) =>
    request('/bookings/quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reserve: (data) =>
    request('/bookings/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  create: (data) =>
    request('/bookings/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id) =>
    request(`/bookings/${id}/cancel`, {
      method: 'POST',
    }),

  getAll: () => request('/bookings'),

  getOwnerDashboard: () => request('/bookings/owner-dashboard'),

  getMyBookings: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(`/bookings/my-bookings${query ? `?${query}` : ''}`);
  },

  markReturned: (id) =>
    request(`/bookings/${id}/return`, {
      method: 'POST',
    }),

  triggerCleanup: () =>
    request('/bookings/cleanup', {
      method: 'POST',
    }),

  getById: (id) => request(`/bookings/${id}`),

  updateStatus: (id, status, remarks) =>
    request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks }),
    }),
};

// 4. Fleet Management & Business Settings (Owner Only)
export const ownerAPI = {
  getSettings: () => request('/owner/settings'),

  updateSettings: (data) =>
    request('/owner/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createBike: (data) =>
    request('/owner/bikes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateBike: (id, data) =>
    request(`/owner/bikes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBike: (id) =>
    request(`/owner/bikes/${id}`, {
      method: 'DELETE',
    }),
};

export const ownersAPI = ownerAPI;

// 5. Renters APIs
export const rentersAPI = {
  getAll: () => request('/renters'),

  submitKYC: (data) =>
    request('/renters/kyc', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id, kycStatus, rejectionReason) =>
    request(`/renters/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ kycStatus, rejectionReason }),
    }),
};

// 6. Support & Enquiries & Disputes APIs
export const supportAPI = {
  submitEnquiry: (data) =>
    request('/support/enquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTickets: () => request('/support/tickets'),

  getDisputes: () => request('/support/disputes'),

  createDispute: (data) =>
    request('/support/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDispute: (id, data) =>
    request(`/support/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// 7. Hubs & Locations APIs
export const hubsAPI = {
  getAll: () => request('/hubs'),
  create: (data) =>
    request('/hubs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 8. Admin APIs
export const adminAPI = {
  getKPIs: () => request('/admin/kpis'),
  getAuditLogs: () => request('/admin/audit-logs'),
  recordAuditLog: (data) =>
    request('/admin/audit-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSettings: () => request('/admin/settings'),
  updateSetting: (key, value) =>
    request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),
  getNotifications: () => request('/admin/notifications'),
  markNotificationRead: (id) => request(`/admin/notifications/${id}/read`, { method: 'PATCH' }),
  getTransactions: () => request('/admin/transactions'),
};

// 9. Upload APIs (Cloudinary Bike Images)
export const uploadAPI = {
  uploadBikeImages: (formData) =>
    request('/upload/bike-images', {
      method: 'POST',
      body: formData,
    }),
  deleteBikeImage: (publicId) =>
    request('/upload/bike-images', {
      method: 'DELETE',
      body: JSON.stringify({ public_id: publicId }),
    }),
};

// 10. Document APIs (Cloudflare R2 & Document Vault)
export const documentsAPI = {
  uploadBikeDocument: (formData, bikeId = 'pending_bike', docType = 'rc') =>
    request(`/documents/bike/${bikeId}/${docType}`, {
      method: 'POST',
      body: formData,
    }),
  uploadUserDocument: (formData, docType = 'aadhaar', userId) =>
    request(userId ? `/documents/user/${userId}/${docType}` : `/documents/user/${docType}`, {
      method: 'POST',
      body: formData,
    }),
  getSignedUrl: (key, expiresIn = 900) =>
    request(`/documents/signed-url?key=${encodeURIComponent(key)}&expiresIn=${expiresIn}`),
  deleteDocument: (key) =>
    request('/documents', {
      method: 'DELETE',
      body: JSON.stringify({ key }),
    }),
  getDirectViewUrl: (keyOrUrl) => {
    if (!keyOrUrl) return '';
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://') || keyOrUrl.startsWith('blob:')) {
      return keyOrUrl;
    }
    const backendBase = BACKEND_URL.replace(/\/api(\/v1)?\/?$/, '');
    const cleanKey = keyOrUrl.replace(/^\/+/, '');
    return `${backendBase}/api/documents/open?key=${encodeURIComponent(cleanKey)}`;
  },
  getFileByBikeUrl: (bikeId, docType) => {
    const backendBase = BACKEND_URL.replace(/\/api(\/v1)?\/?$/, '');
    return `${backendBase}/api/documents/file/${encodeURIComponent(bikeId)}/${encodeURIComponent(docType)}`;
  },
};

// 11. Razorpay Payment APIs
export const paymentAPI = {
  createOrder: (data) =>
    request('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  verify: (data) =>
    request('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};


