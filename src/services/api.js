import { Platform } from 'react-native';

// Dynamic API Base URL detection
export const API_BASE_URL = (() => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return `http://${window.location.hostname}:5000/api/v1`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1'; // Android emulator localhost alias
  }
  return 'http://localhost:5000/api/v1';
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
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authStorage.getToken();

  const headers = {
    'Content-Type': 'application/json',
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

  create: (data) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: () => request('/bookings'),

  getById: (id) => request(`/bookings/${id}`),

  updateStatus: (id, status, remarks) =>
    request(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks }),
    }),
};

// 4. Owners APIs
export const ownersAPI = {
  getAll: () => request('/owners'),

  submitKYC: (data) =>
    request('/owners/kyc', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id, kycStatus, rejectionReason) =>
    request(`/owners/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ kycStatus, rejectionReason }),
    }),
};

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

