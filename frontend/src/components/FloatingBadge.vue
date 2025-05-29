<!-- frontend/src/components/FloatingBadge.vue -->
<template>
  <div 
    v-motion
    :initial="{ opacity: 0, scale: 0.8, y: 20 }"
    :enter="{ 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        duration: 800, 
        delay: delay,
        ease: 'easeOut'
      } 
    }"
    :class="[
      'absolute z-10 pointer-events-none select-none',
      'bg-card/70 backdrop-blur-md border border-border/40',
      'rounded-full px-5 py-3 shadow-xl',
      'text-sm font-semibold text-foreground',
      'floating-badge',
      positionClass
    ]"
  >
    <div class="flex items-center gap-2">
      <div class="relative">
        <component 
          :is="iconComponent" 
          v-if="iconComponent"
          :class="iconColor"
          class="w-5 h-5 relative z-10"
        />
        <!-- Icon glow effect -->
        <div 
          v-if="iconComponent"
          class="absolute inset-0 w-5 h-5 rounded-full opacity-20 blur-sm"
          :class="iconGlowColor"
        ></div>
      </div>
      <span class="relative z-10">{{ text }}</span>
    </div>
    
    <!-- Subtle gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-full"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Zap, Brain, Globe, Star } from 'lucide-vue-next'

interface Props {
  text: string
  icon?: 'ai' | 'fast' | 'platform' | 'professional'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right'
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top-left',
  delay: 0
})

const iconComponent = computed(() => {
  switch (props.icon) {
    case 'ai': return Brain
    case 'fast': return Zap
    case 'platform': return Globe
    case 'professional': return Star
    default: return null
  }
})

const iconColor = computed(() => {
  switch (props.icon) {
    case 'ai': return 'text-purple-500'
    case 'fast': return 'text-yellow-500'
    case 'platform': return 'text-blue-500'
    case 'professional': return 'text-green-500'
    default: return 'text-muted-foreground'
  }
})

const iconGlowColor = computed(() => {
  switch (props.icon) {
    case 'ai': return 'bg-purple-500'
    case 'fast': return 'bg-yellow-500'
    case 'platform': return 'bg-blue-500'
    case 'professional': return 'bg-green-500'
    default: return 'bg-muted-foreground'
  }
})

const positionClass = computed(() => {
  switch (props.position) {
    case 'top-left': return 'top-4 left-4 md:top-8 md:left-8'
    case 'top-right': return 'top-4 right-4 md:top-8 md:right-8'
    case 'bottom-left': return 'bottom-4 left-4 md:bottom-8 md:left-8'
    case 'bottom-right': return 'bottom-4 right-4 md:bottom-8 md:right-8'
    case 'center-left': return 'top-1/2 left-4 md:left-8 transform -translate-y-1/2'
    case 'center-right': return 'top-1/2 right-4 md:right-8 transform -translate-y-1/2'
    default: return 'top-4 left-4'
  }
})
</script>

<style scoped>
.floating-badge {
  animation: float 6s ease-in-out infinite;
  backdrop-filter: blur(12px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-12px) rotate(1deg);
  }
  66% {
    transform: translateY(-6px) rotate(-0.5deg);
  }
}

/* Stagger the animation for different badges with more variety */
.floating-badge:nth-child(1) { 
  animation-delay: 0s; 
  animation-duration: 6s;
}
.floating-badge:nth-child(2) { 
  animation-delay: 1.5s; 
  animation-duration: 7s;
}
.floating-badge:nth-child(3) { 
  animation-delay: 3s; 
  animation-duration: 5.5s;
}
.floating-badge:nth-child(4) { 
  animation-delay: 4.5s; 
  animation-duration: 6.5s;
}

/* Enhanced hover state (even though pointer-events are none) */
.floating-badge:hover {
  transform: scale(1.05);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .floating-badge {
    font-size: 0.75rem;
    padding: 0.5rem 0.875rem;
    backdrop-filter: blur(8px);
    /* Simpler animation on mobile for performance */
    animation: mobileFloat 4s ease-in-out infinite;
  }
  
  .floating-badge svg {
    width: 1rem;
    height: 1rem;
  }
}

/* Simplified mobile animation */
@keyframes mobileFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .floating-badge {
    animation: none;
  }
}
</style> 