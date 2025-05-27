// src/services/apiService.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore' // Still needed for response interceptor
// import router from '@/router'; // If you need to redirect from interceptor

// Ensure this matches the variable name in your .env file
const BACKEND_API_URL = import.meta.env.BACKEND_API_URL || 'http://localhost:3001/api'

const apiClient = axios.create({
  baseURL: BACKEND_API_URL,
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

    // Specifically check for 401 (Unauthorized) or 403 (Forbidden)
    // And ensure we don't get into an infinite loop if a retry mechanism was in place.
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retryAttempted) {
      originalRequest._retryAttempted = true // Mark to prevent potential infinite loops with retries

      // If the error is on a '/auth/me' call, it often means the session is invalid/expired from the start.
      // Or if any other API call returns 401/403.
      if (authStore.isAuthenticated) {
        // Only trigger logout if user was thought to be authenticated
        console.warn(`API request to ${originalRequest.url} failed with ${error.response.status}. Logging out.`)
        await authStore.logout() // Ensure logout clears state and redirects to login
        // The logout action in your authStore should handle router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
