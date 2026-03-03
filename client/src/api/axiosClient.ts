/**
 * Axios client. CSRF, base URL, 401 refresh interceptor.
 * @module axiosClient
 */
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * Extract CSRF token from browser cookies
 * @returns CSRF token string or null if not found
 */
function getCsrfTokenFromCookie(): string | null {
  const name = 'us.powerback.csrf-token=';
  const decoded = decodeURIComponent(document.cookie);
  const parts = decoded.split(';');

  for (let p of parts) {
    p = p.trim();
    if (p.startsWith(name)) {
      return p.substring(name.length);
    }
  }

  return null;
}

/**
 * Create axios instance with default configuration
 */
const axiosClient: AxiosInstance = axios.create({
  // Always use relative /api/ path - nginx will proxy to Node.js backend
  // This works in both dev (via setupProxy) and production (via nginx)
  baseURL: '/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Set or clear the Authorization Bearer token header
 * @param token - JWT token string, or empty string to clear
 */
export function setBearerToken(token: string | '') {
  if (token) {
    axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    axiosClient.defaults.headers.common['Authorization'] = '';
  }
}

/**
 * Request interceptor: Automatically add CSRF token to all requests
 */
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const csrf = getCsrfTokenFromCookie();
    // Only add CSRF token if it exists and is not empty (don't send empty string)
    // Backend will validate it only on routes that use csrfTokenValidator() middleware
    if (csrf && csrf.trim() && config.headers) {
      config.headers['X-CSRF-Token'] = csrf;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Automatically refresh token on 401 and retry request
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => {
    // Fix: Parse response data if it's a string (production build issue)
    // This happens when axios doesn't auto-parse JSON in production
    if (typeof response.data === 'string') {
      const trimmed = response.data.trim();
      // Try to parse if it looks like JSON (starts with [ or {)
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          response.data = JSON.parse(response.data);
        } catch (e) {
          // If parsing fails, return as-is
        }
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip auto-refresh for refresh endpoint and public endpoints to prevent infinite loops
    // Note: originalRequest.url is relative (without baseURL), so use 'users/refresh' not '/users/refresh'
    const isPublicEndpoint =
      originalRequest.url?.includes('users/refresh') ||
      originalRequest.url?.includes('users/unsubscribe') ||
      originalRequest.url?.includes('users/activate') ||
      originalRequest.url?.includes('users/reset');

    if (isPublicEndpoint) {
      // For public endpoints, reject immediately - don't try to auto-refresh
      return Promise.reject(error);
    }

    // If 401 and we haven't already tried refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Import API dynamically to avoid circular dependency
        const { default: API } = await import('./API');

        // Refresh the token
        const { data } = await API.refreshToken();

        // Update Authorization header for future requests
        setBearerToken(data.accessToken);

        // Update the original request's Authorization header
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] =
            `Bearer ${data.accessToken}`;
        }

        // Process queued requests
        processQueue(null, data.accessToken);

        // Retry the original request
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth state and reject
        processQueue(refreshError as Error, null);

        // Clear Authorization header
        setBearerToken('');

        // Redirect to login or handle logout
        // Note: You may want to dispatch a logout action here
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Not a 401, or already retried - pass through
    return Promise.reject(error);
  }
);

export default axiosClient;
