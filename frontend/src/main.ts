//frontend/src/main.ts:
import { createApp } from 'vue'
import App from './App.vue'
import './assets/tailwind.css'
import router from './router' // router'ı import ediyorsun
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import { useAuthStore } from './stores/authStore' // authStore'u import etmelisin
import { useThemeStore } from './stores/themeStore' // themeStore'u import etmelisin
import { MotionPlugin } from '@vueuse/motion'

const pinia = createPinia() // Pinia instance'ı oluşturuluyor
pinia.use(piniaPersist) // piniaPersist plugin'i kullanılıyor

const app = createApp(App)

app.use(pinia) // Pinia'yı app'e önce tanıt
app.use(MotionPlugin) // Motion plugin'i ekle

// authStore ve themeStore instance'larını alabilmek için Pinia'nın app tarafından kullanılması lazım
const authStore = useAuthStore()
const themeStore = useThemeStore()

// Initialize theme first (synchronous)
themeStore.initializeTheme()

// Set up session monitoring for automatic token refresh
authStore.setupSessionMonitoring()

// Add app focus handler for session refresh
if (typeof window !== 'undefined') {
  // Refresh session when app regains focus (user returns to tab)
  window.addEventListener('focus', () => {
    console.log('🔄 [MAIN] App focused - checking session state')
    if (authStore.isUserAuthenticated) {
      authStore.initializeAuth().catch(error => {
        console.warn('⚠️ [MAIN] Session refresh on focus failed:', error)
      })
    }
  })
  
  // Refresh session when page becomes visible (user switches back to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && authStore.isUserAuthenticated) {
      console.log('🔄 [MAIN] Page visible - checking session state')
      authStore.initializeAuth().catch(error => {
        console.warn('⚠️ [MAIN] Session refresh on visibility failed:', error)
      })
    }
  })
}

// Let the router guard handle auth initialization to avoid race conditions
console.log('🚀 [MAIN] App initialization - auth will be handled by router guard')
app.use(router) // Install router first
app.mount('#app') // Mount app immediately
