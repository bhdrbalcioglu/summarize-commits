import { useThemeStore } from '@/stores/themeStore'

export function useThemeTransition() {
  const themeStore = useThemeStore()

  const runThemeTransition = () => {
    themeStore.toggleDarkMode()
  }

  return { runThemeTransition }
}
