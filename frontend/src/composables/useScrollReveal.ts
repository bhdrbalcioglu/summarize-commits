import { ref, onMounted, onUnmounted } from 'vue'

export interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
  delay?: number
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    once = true,
    delay = 0
  } = options

  const isVisible = ref(false)
  const elementRef = ref<HTMLElement>()
  let observer: IntersectionObserver | null = null

  const observerCallback = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          isVisible.value = true
        }, delay)
        
        if (once && observer) {
          observer.unobserve(entry.target)
        }
      } else if (!once) {
        isVisible.value = false
      }
    })
  }

  onMounted(() => {
    if (elementRef.value) {
      observer = new IntersectionObserver(observerCallback, {
        threshold,
        rootMargin
      })
      observer.observe(elementRef.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    elementRef,
    isVisible
  }
}

// Predefined animation variants
export const revealVariants = {
  fadeInUp: {
    initial: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 }
  },
  fadeInDown: {
    initial: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 }
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 }
  },
  fadeInRight: {
    initial: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  },
  slideInUp: {
    initial: { opacity: 0, y: 60, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 }
  }
} 