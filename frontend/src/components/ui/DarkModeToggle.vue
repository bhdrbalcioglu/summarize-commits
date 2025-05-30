<!-- frontend/src/components/ui/DarkModeToggle.vue -->
<template>
  <div class="flex items-center space-x-2">
    <Sun class="h-4 w-4" />
    <Switch 
      :checked="themeStore.isDarkMode" 
      @click="handleToggle"
      class="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200"
    />
    <Moon class="h-4 w-4" />
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { useThemeStore } from '@/stores/themeStore'
import { useThemeTransition } from '@/composables/useThemeTransition'

const themeStore = useThemeStore()
const { runThemeTransition } = useThemeTransition()

const handleToggle = () => {
  runThemeTransition()
}
</script>

<style scoped>
/* Additional styles for smooth icon transitions */
.transition-colors {
  transition-property: color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style> 