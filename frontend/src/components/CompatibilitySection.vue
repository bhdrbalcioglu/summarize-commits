<!-- frontend/src/components/CompatibilitySection.vue -->
<template>
  <div 
    v-motion
    :initial="{ opacity: 0, y: 30 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 800 } }"
    class="w-full max-w-2xl mx-auto mt-16 mb-8"
  >
    <div class="text-center">
      <p class="text-muted-foreground text-sm mb-6 font-medium">
        Compatible with
      </p>
      
      <div class="flex items-center justify-center gap-12">
        <!-- GitHub Logo -->
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer"
          class="group flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-muted/50"
        >
          <div class="w-8 h-8 transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full text-foreground">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <span class="font-semibold text-foreground group-hover:text-primary transition-colors">
            GitHub
          </span>
        </a>

        <!-- Divider -->
        <div class="w-px h-8 bg-border"></div>

        <!-- GitLab Logo -->
        <a 
          href="https://gitlab.com" 
          target="_blank" 
          rel="noopener noreferrer"
          class="group flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-muted/50"
        >
          <div class="w-8 h-8 transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full text-orange-500">
              <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.423-.73-.423-.867 0L16.418 9.45H7.582L4.919 1.263c-.135-.423-.73-.423-.867 0L1.386 9.45.044 13.587a.905.905 0 00.331 1.013L12 23.054l11.625-8.454a.905.905 0 00.33-1.013zM12 20.416L5.462 15.204 7.582 9.45h8.835l2.12 5.754L12 20.416z"/>
            </svg>
          </div>
          <span class="font-semibold text-foreground group-hover:text-orange-500 transition-colors">
            GitLab
          </span>
        </a>
      </div>

      <!-- Additional info -->
      <p class="text-xs text-muted-foreground mt-4 opacity-75">
        Seamlessly integrates with your favorite Git hosting platform
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props needed for this simple component
</script>

<style scoped>
/* Additional hover effects for the logos */
a:hover svg {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}
</style> 