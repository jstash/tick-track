/**
 * API client for communicating with the FastAPI backend.
 * Base URL is configured via Vite proxy (see vite.config.js).
 */

const API_BASE_URL = '/api';

/**
 * Get the stored auth token from localStorage.
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Set the auth token in localStorage.
 */
export const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token);
};

/**
 * Remove the auth token from localStorage.
 */
export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

/**
 * Make an authenticated API request.
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Auth API endpoints
 */
export const authAPI = {
  /**
   * Login with username and password.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{access_token: string, token_type: string}>}
   */
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    setAuthToken(data.access_token);
    return data;
  },

  /**
   * Register a new user.
   * @param {Object} userData - {username, full_name, email, password}
   * @returns {Promise<{access_token: string, token_type: string}>}
   */
  register: async (userData) => {
    const data = await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  /**
   * Get current authenticated user.
   * @returns {Promise<Object>}
   */
  getCurrentUser: async () => {
    return apiRequest('/users/me');
  },

  /**
   * Logout (clears token).
   */
  logout: () => {
    removeAuthToken();
  },
};

/**
 * Prices API endpoints
 */
export const pricesAPI = {
  /**
   * Get prices for comma-separated tickers.
   * @param {string} tickers - Comma-separated ticker symbols (e.g., "AAPL,MSFT")
   * @returns {Promise<{prices: Array, missing: Array}>}
   */
  getPrices: async (tickers) => {
    return apiRequest(`/prices?tickers=${encodeURIComponent(tickers)}`);
  },

  /**
   * Get price history for a ticker.
   * @param {string} ticker - Ticker symbol
   * @param {number} hours - Number of hours of history (default: 24)
   * @returns {Promise<{prices: Array}>}
   */
  getPriceHistory: async (ticker, hours = 24) => {
    return apiRequest(`/price/${ticker}/history?hours=${hours}`);
  },

  /**
   * Manually trigger price update.
   * @returns {Promise<{prices: Array}>}
   */
  updatePrices: async () => {
    return apiRequest('/update-prices');
  },
};

/**
 * Watchlist API endpoints
 */
export const watchlistAPI = {
  /**
   * Get user's watchlist.
   * @returns {Promise<Array>}
   */
  getWatchlist: async () => {
    return apiRequest('/watchlist');
  },

  /**
   * Add symbol to watchlist.
   * @param {string} symbol - Ticker symbol
   * @returns {Promise<Object>}
   */
  addToWatchlist: async (symbol) => {
    return apiRequest('/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  },

  /**
   * Remove symbol from watchlist.
   * @param {string} symbol - Ticker symbol
   * @returns {Promise<Object>}
   */
  removeFromWatchlist: async (symbol) => {
    return apiRequest(`/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    });
  },
};
