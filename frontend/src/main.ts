//frontend/src/main.ts:
import { createApp } from 'vue'
import App from './App.vue'
import './assets/tailwind.css'
import router from './router' // router'ı import ediyorsun
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import { useAuthStore } from './stores/authStore' // authStore'u import etmelisin

const pinia = createPinia() // Pinia instance'ı oluşturuluyor
pinia.use(piniaPersist) // piniaPersist plugin'i kullanılıyor

const app = createApp(App)

app.use(pinia) // Pinia'yı app'e önce tanıt

// authStore instance'ını alabilmek için Pinia'nın app tarafından kullanılması lazım
const authStore = useAuthStore()

// initializeAuth asenkron bir işlem olduğu için .then() ile devam et
authStore
  .initializeAuth()
  .then(() => {
    console.log('using user', authStore.user, authStore.isAuthenticated, authStore.isLoading) // Eğer hata olursa, authStore'daki değerleri logla (örnek amaçl
    app.use(router) // Router'ı auth işlemi bittikten sonra ekle
    app.mount('#app')
  })
  .catch((error) => {
    console.error('Error during app initialization:', error)
    app.use(router) // Hata olsa bile router'ı yükle
    app.mount('#app') // Ve app'i mount et
  })
