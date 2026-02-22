import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Simple request deduplicator to prevent infinite loops
const pendingRequests = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 100; // ms

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const requestKey = `${config.method}:${config.url}`;
  const now = Date.now();
  const lastRequestTime = pendingRequests.get(requestKey);

  if (lastRequestTime && (now - lastRequestTime) < MIN_REQUEST_INTERVAL) {
    console.warn(`[API] Throttling duplicate request: ${requestKey}`);
    return Promise.reject(new Error('Throttled: Duplicate request detected within interval'));
  }

  pendingRequests.set(requestKey, now);
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.error('[API 429] Too many requests. Check for infinite loops in useEffect hooks.');
    }
    return Promise.reject(error);
  }
);

export default api;
