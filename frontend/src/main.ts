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

// Let the router guard handle auth initialization to avoid race conditions
console.log('🚀 [MAIN] App initialization - auth will be handled by router guard')
app.use(router) // Install router first
app.mount('#app') // Mount app immediately
