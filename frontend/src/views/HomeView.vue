<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Gradient Background Hero Section -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-background/80 to-transparent"></div>

    <!-- Animated Background Orbs -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>

    <div class="relative z-10 p-6 min-h-screen flex flex-col items-center">
      <!-- Floating Feature Badges -->
      <div class="hidden sm:block">
        <FloatingBadge text="AI-Powered" icon="ai" position="top-left" :delay="1000" />
        <FloatingBadge text="Lightning Fast" icon="fast" position="top-right" :delay="1200" />
        <FloatingBadge text="Multi-Platform" icon="platform" position="center-left" :delay="1400" />
        <FloatingBadge text="Professional Results" icon="professional" position="center-right" :delay="1600" />
      </div>

      <!-- Hero Section with Enhanced Typography -->
      <div v-motion :initial="{ opacity: 0, y: 30 }" :enter="{ opacity: 1, y: 0, transition: { duration: 600 } }" class="text-center max-w-4xl relative z-20 mt-8 md:mt-16 mb-8 px-4">
        <h1 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-primary via-foreground to-secondary bg-clip-text text-transparent">Git Commit Summarizer</h1>
        <p class="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed mb-2">Stop writing boring release notes manually.</p>
        <p class="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed mb-6 md:mb-8">
          Transform your messy git commits into
          <span class="text-primary font-semibold">professional update notes</span>
          that users actually want to read—in seconds, not hours.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <EnhancedButton variant="primary" size="lg" text="Start Creating Beautiful Release Notes" @click="handleGetStarted" />
          <EnhancedButton variant="outline" size="lg" text="See It in Action" @click="handleWatchDemo" />
        </div>
      </div>

      <!-- Before/After Showcase with Scroll Reveal -->
      <div
        ref="beforeAfterRef"
        v-motion
        :initial="{ opacity: 0, y: 80, scale: 0.95 }"
        :enter="{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 900,
            delay: 800,
            ease: 'easeOut'
          }
        }"
        class="w-full"
      >
        <BeforeAfterToggle />
      </div>

      <!-- How It Works Section with Staggered Reveals -->
      <div class="mt-16 md:mt-32 max-w-6xl w-full px-4">
        <div
          ref="howItWorksHeaderRef"
          v-motion
          :initial="{ opacity: 0, y: 50 }"
          :enter="{
            opacity: 1,
            y: 0,
            transition: {
              duration: 800,
              delay: 1200,
              ease: 'easeOut'
            }
          }"
          data-how-it-works
          class="text-center mb-12 md:mb-20"
        >
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">From Messy to Professional in 3 Steps</h2>
          <p class="text-lg sm:text-xl text-muted-foreground mb-8 md:mb-16 max-w-2xl mx-auto">
            No more copy-pasting commit messages or spending hours crafting release notes.
            <br class="hidden md:block" />
            <span class="text-primary font-semibold">Get publication-ready updates in under 60 seconds.</span>
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <!-- Step 1 Card -->
          <div
            ref="step1Ref"
            v-motion
            :initial="{ opacity: 0, x: -60, y: 40, scale: 0.9 }"
            :enter="{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              transition: {
                duration: 700,
                delay: 200,
                ease: 'easeOut'
              }
            }"
            class="group relative"
          >
            <div class="bg-card/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:scale-105 h-full flex flex-col">
              <div class="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 mx-auto shadow-lg">1</div>
              <h3 class="text-xl font-bold mb-4 text-foreground">Connect in One Click</h3>
              <p class="text-muted-foreground leading-relaxed flex-grow">
                Link your GitHub or GitLab repository with enterprise-grade security.
                <span class="text-primary font-medium">Zero setup required</span>—start immediately.
              </p>
            </div>
            <div class="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
          </div>

          <!-- Step 2 Card -->
          <div
            ref="step2Ref"
            v-motion
            :initial="{ opacity: 0, y: 60, scale: 0.9 }"
            :enter="{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: 700,
                delay: 400,
                ease: 'easeOut'
              }
            }"
            class="group relative"
          >
            <div class="bg-card/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:scale-105 h-full flex flex-col">
              <div class="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 mx-auto shadow-lg">2</div>
              <h3 class="text-xl font-bold mb-4 text-foreground">Choose Your Timeline</h3>
              <p class="text-muted-foreground leading-relaxed flex-grow">
                Select specific commits, date ranges, or entire releases.
                <span class="text-primary font-medium">Smart filtering</span> lets you include exactly what matters.
              </p>
            </div>
            <div class="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-secondary/50 to-transparent"></div>
          </div>

          <!-- Step 3 Card -->
          <div
            ref="step3Ref"
            v-motion
            :initial="{ opacity: 0, x: 60, y: 40, scale: 0.9 }"
            :enter="{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              transition: {
                duration: 700,
                delay: 600,
                ease: 'easeOut'
              }
            }"
            class="group"
          >
            <div class="bg-card/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:scale-105 h-full flex flex-col">
              <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 mx-auto shadow-lg">3</div>
              <h3 class="text-xl font-bold mb-4 text-foreground">Get Instant Results</h3>
              <p class="text-muted-foreground leading-relaxed flex-grow">
                AI creates structured, categorized release notes with emojis and formatting.
                <span class="text-green-600 font-medium">Copy, customize, and publish</span> immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Compatibility Section with Scroll Reveal -->
      <div ref="compatibilityRef" v-motion :initial="compatibilityVariant.initial" :enter="compatibilityVariant.visible">
        <CompatibilitySection />
      </div>

      <footer class="mt-auto py-8 w-full bg-card/50 backdrop-blur-sm border-t border-border/50 text-center">
        <div class="max-w-4xl mx-auto">
          <p class="text-lg text-muted-foreground mb-2">Join developers who've already saved hundreds of hours on release notes</p>
          <p class="text-sm text-muted-foreground">&copy; 2024 Git Commit Summarizer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import BeforeAfterToggle from '@/components/BeforeAfterToggle.vue'
import FloatingBadge from '@/components/FloatingBadge.vue'
import CompatibilitySection from '@/components/CompatibilitySection.vue'
import EnhancedButton from '@/components/ui/EnhancedButton.vue'
import { useScrollReveal, revealVariants } from '@/composables/useScrollReveal'

// Scroll reveal setup for different sections
const { elementRef: beforeAfterRef, isVisible: isBeforeAfterVisible } = useScrollReveal({ delay: 200 })
const { elementRef: howItWorksHeaderRef, isVisible: isHeaderVisible } = useScrollReveal({ delay: 100 })
const { elementRef: step1Ref, isVisible: isStep1Visible } = useScrollReveal({ delay: 0 })
const { elementRef: step2Ref, isVisible: isStep2Visible } = useScrollReveal({ delay: 200 })
const { elementRef: step3Ref, isVisible: isStep3Visible } = useScrollReveal({ delay: 400 })
const { elementRef: compatibilityRef, isVisible: isCompatibilityVisible } = useScrollReveal({ delay: 300 })

// Animation variants for different elements
const beforeAfterVariant = {
  initial: { opacity: 0, y: 60, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 800, ease: 'easeOut' } }
}

const headerVariant = {
  initial: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 600, ease: 'easeOut' } }
}

const cardVariants = [
  {
    initial: { opacity: 0, x: -40, y: 20 },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: 600, ease: 'easeOut' } }
  },
  {
    initial: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 600, ease: 'easeOut' } }
  },
  {
    initial: { opacity: 0, x: 40, y: 20 },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: 600, ease: 'easeOut' } }
  }
]

const compatibilityVariant = {
  initial: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 600, ease: 'easeOut' } }
}

// Button handlers
const handleGetStarted = () => {
  const loginButton = document.querySelector('[data-login-button]')
  if (loginButton) {
    ;(loginButton as HTMLElement).click()
  }
}

const handleWatchDemo = () => {
  const howItWorksElement = document.querySelector('[data-how-it-works]')
  if (howItWorksElement) {
    howItWorksElement.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>
