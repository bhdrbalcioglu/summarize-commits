<!-- frontend/src/components/ui/EnhancedButton.vue -->
<template>
  <button
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false; isPressed = false"
    @mousedown="isPressed = true"
    @mouseup="isPressed = false"
  >
    <!-- Background animations -->
    <div class="absolute inset-0 rounded-xl overflow-hidden">
      <!-- Ripple effect -->
      <div 
        v-if="showRipple"
        class="absolute inset-0 bg-white/20 rounded-xl animate-ping"
        @animationend="showRipple = false"
      ></div>
      
      <!-- Hover glow -->
      <div 
        v-if="variant === 'primary'"
        class="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl opacity-0 transition-opacity duration-300"
        :class="{ 'opacity-100': isHovered }"
      ></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex items-center justify-center gap-2">
      <!-- Loading spinner -->
      <div
        v-if="loading"
        class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
      ></div>
      
      <!-- Icon -->
      <component 
        v-if="icon && !loading" 
        :is="icon" 
        :class="iconClasses"
      />
      
      <!-- Text with subtle animations -->
      <span 
        class="font-semibold transition-all duration-200"
        :class="{ 'transform scale-95': isPressed }"
      >
        <slot>{{ text }}</slot>
      </span>
      
      <!-- Arrow icon for primary buttons -->
      <svg 
        v-if="variant === 'primary' && !loading && !icon"
        class="w-5 h-5 transition-transform duration-300"
        :class="{ 'translate-x-1': isHovered }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </div>

    <!-- Shine effect on hover -->
    <div 
      v-if="variant === 'primary'"
      class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 rounded-xl"
      :class="{ 'translate-x-full': isHovered }"
    ></div>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Component } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  text?: string
  icon?: Component
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHovered = ref(false)
const isPressed = ref(false)
const showRipple = ref(false)

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    showRipple.value = true
    emit('click', event)
  }
}

const baseClasses = 'relative overflow-hidden transition-all duration-300 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transform-gpu enhanced-button animate-optimized'

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl focus:ring-primary/50 hover:scale-105'
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md hover:shadow-lg focus:ring-secondary/50 hover:scale-105'
    case 'outline':
      return 'bg-card/80 backdrop-blur-sm text-foreground border-2 border-border/50 hover:border-primary/50 hover:bg-card shadow-lg hover:shadow-xl focus:ring-primary/50 hover:scale-105'
    case 'ghost':
      return 'text-foreground hover:bg-muted/50 focus:ring-muted/50'
    default:
      return ''
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-4 py-2 text-sm'
    case 'md':
      return 'px-6 py-3 text-base'
    case 'lg':
      return 'px-8 py-4 text-lg'
    case 'xl':
      return 'px-10 py-5 text-xl'
    default:
      return 'px-6 py-3 text-base'
  }
})

const iconClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-4 h-4'
    case 'md':
      return 'w-5 h-5'
    case 'lg':
      return 'w-6 h-6'
    case 'xl':
      return 'w-7 h-7'
    default:
      return 'w-5 h-5'
  }
})

const buttonClasses = computed(() => [
  baseClasses,
  variantClasses.value,
  sizeClasses.value,
  {
    'w-full': props.fullWidth,
    'opacity-50 cursor-not-allowed': props.disabled || props.loading,
    'scale-95': isPressed.value && !props.disabled && !props.loading
  }
])
</script>

<style scoped>
/* Additional animations for ripple effect */
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Smooth transform transitions */
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus styles */
button:focus-visible {
  outline: none;
  ring: 2px;
  ring-offset: 2px;
}
</style> 