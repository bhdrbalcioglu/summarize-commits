// src/services/apiService.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore' // Still needed for response interceptor
// import router from '@/router'; // If you need to redirect from interceptor

// Ensure this matches the variable name in your .env file
const API_ROOT = `${import.meta.env.VITE_API_BASE_URL}/api`

const apiClient = axios.create({
  baseURL: API_ROOT,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // IMPORTANT: Allows sending HttpOnly cookies cross-origin
})

// Request Interceptor:
// If using HttpOnly cookies, the Authorization header is typically NOT set manually by the frontend.
// The browser handles sending the cookie. So, the original request interceptor can be removed or simplified.
// If you had other logic in the request interceptor (e.g., logging), that could remain.
// For now, let's remove the token-adding part.
apiClient.interceptors.request.use(
  (config) => {
    // If you need to do something with requests BEFORE they are sent,
    // like adding a common header (other than Auth for HttpOnly cookies), do it here.
    // console.log('Starting Request', config);
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor (Recommended for handling auth errors globally)
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response
  },
  async (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const originalRequest = error.config
    const authStore = useAuthStore() // Access outside setup in Pinia requires this pattern

    // Only logout on auth-specific endpoints, not all 401/403 errors
    const isAuthEndpoint = originalRequest.url?.includes('/auth/') || originalRequest.url?.includes('/me')

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retryAttempted) {
      originalRequest._retryAttempted = true

      if (isAuthEndpoint && authStore.isUserAuthenticated) {
        // Only trigger logout if it's an auth endpoint failure
        console.warn(`Auth endpoint ${originalRequest.url} failed with ${error.response.status}. Logging out.`)
        await authStore.logout() // Ensure logout clears state and redirects to login
      } else {
        // For non-auth endpoints, just log the error but don't logout
        console.warn(`API request to ${originalRequest.url} failed with ${error.response.status}. Not logging out.`)
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
export { apiClient as apiService }
