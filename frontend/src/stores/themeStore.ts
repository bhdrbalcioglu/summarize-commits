import { defineStore } from 'pinia'
import { GLOBAL_KEYS, getStorageValue, setStorageValue, removeStorageValue } from '@/utils/localStorage'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeState {
  mode: ThemeMode
  isDarkMode: boolean
  systemPreference: 'light' | 'dark'
}

// Helper to detect system theme preference
function detectSystemPreference(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// Helper to get stored theme mode
function getStoredThemeMode(): ThemeMode {
  return getStorageValue<ThemeMode>(GLOBAL_KEYS.THEME_MODE, 'system')
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    mode: getStoredThemeMode(),
    isDarkMode: false, // Will be computed in initializeTheme
    systemPreference: detectSystemPreference()
  }),

  getters: {
    currentTheme: (state): 'light' | 'dark' => {
      if (state.mode === 'system') {
        return state.systemPreference
      }
      return state.mode as 'light' | 'dark'
    },

    isSystemDark: (state): boolean => state.systemPreference === 'dark'
  },

  actions: {
    setTheme(mode: ThemeMode) {
      this.mode = mode
      this.updateDarkMode()
      this.persistTheme()
      this.applyThemeToDocument()
    },

    toggleDarkMode() {
      // If in system mode, switch to explicit mode based on current preference
      if (this.mode === 'system') {
        const newMode = this.systemPreference === 'dark' ? 'light' : 'dark'
        this.setTheme(newMode)
      } else {
        // Toggle between light and dark
        const newMode = this.mode === 'dark' ? 'light' : 'dark'
        this.setTheme(newMode)
      }
    },

    updateDarkMode() {
      this.isDarkMode = this.currentTheme === 'dark'
    },

    detectSystemPreference() {
      this.systemPreference = detectSystemPreference()
      if (this.mode === 'system') {
        this.updateDarkMode()
        this.applyThemeToDocument()
      }
    },

    persistTheme() {
      setStorageValue(GLOBAL_KEYS.THEME_MODE, this.mode)
    },

    applyThemeToDocument() {
      if (typeof document !== 'undefined') {
        const html = document.documentElement
        const shouldBeDark = this.currentTheme === 'dark'

        if (shouldBeDark) {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }

        // Force a style recalculation
        html.style.colorScheme = shouldBeDark ? 'dark' : 'light'
      }
    },

    initializeTheme() {
      // Set up system preference listener
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        // Initial detection
        this.detectSystemPreference()

        // Listen for changes
        const handleChange = () => {
          this.detectSystemPreference()
        }

        mediaQuery.addEventListener('change', handleChange)

        // Store cleanup function (optional for advanced usage)
        this.mediaQueryCleanup = () => {
          mediaQuery.removeEventListener('change', handleChange)
        }
      }

      // Apply initial theme
      this.updateDarkMode()
      this.applyThemeToDocument()
    },

    cleanup() {
      // Clean up media query listener if needed
      if (this.mediaQueryCleanup) {
        this.mediaQueryCleanup()
      }
    }
  }
})

// Extend the store interface for cleanup function
declare module 'pinia' {
  export interface PiniaCustomProperties {
    mediaQueryCleanup?: () => void
  }
}
