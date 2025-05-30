<template>
  <div class="bg-background/50 rounded-lg border border-border/30 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full bg-card/80 backdrop-blur-sm shadow-inner rounded-lg overflow-hidden">
        <thead class="bg-muted/60">
          <tr class="animate-pulse">
            <th class="py-4 px-6 border-b border-border text-left">
              <div class="bg-muted/60 rounded h-4 w-4 animate-shimmer"></div>
            </th>
            <th class="py-4 px-6 border-b border-border text-left">
              <div class="bg-muted/60 rounded h-4 w-16 animate-shimmer" style="animation-delay: 0.1s"></div>
            </th>
            <th class="py-4 px-6 border-b border-border text-left">
              <div class="bg-muted/60 rounded h-4 w-32 animate-shimmer" style="animation-delay: 0.2s"></div>
            </th>
            <th class="py-4 px-6 border-b border-border text-left">
              <div class="bg-muted/60 rounded h-4 w-20 animate-shimmer" style="animation-delay: 0.3s"></div>
            </th>
            <th class="py-4 px-6 border-b border-border text-left">
              <div class="bg-muted/60 rounded h-4 w-24 animate-shimmer" style="animation-delay: 0.4s"></div>
            </th>
            <th class="py-4 px-6 border-b border-border text-left">
              <div class="bg-muted/60 rounded h-4 w-16 animate-shimmer" style="animation-delay: 0.5s"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in 8" :key="'body-' + n" class="animate-pulse hover:bg-muted/20 transition-colors duration-200" :style="{ animationDelay: `${n * 0.1}s` }">
            <!-- Checkbox column -->
            <td class="py-4 px-6 border-b border-border/30">
              <div class="bg-muted/60 rounded h-4 w-4 animate-shimmer"></div>
            </td>
            <!-- Short ID column -->
            <td class="py-4 px-6 border-b border-border/30">
              <div class="bg-muted/60 rounded h-4 animate-shimmer" :style="{ width: `${Math.random() * 20 + 40}px`, animationDelay: `${n * 0.1 + 0.2}s` }"></div>
            </td>
            <!-- Title column -->
            <td class="py-4 px-6 border-b border-border/30">
              <div class="space-y-2">
                <div class="bg-muted/60 rounded h-4 animate-shimmer" :style="{ width: `${Math.random() * 200 + 150}px`, animationDelay: `${n * 0.1 + 0.3}s` }"></div>
                <div class="bg-muted/40 rounded h-3 animate-shimmer" :style="{ width: `${Math.random() * 100 + 100}px`, animationDelay: `${n * 0.1 + 0.4}s` }"></div>
              </div>
            </td>
            <!-- Author column -->
            <td class="py-4 px-6 border-b border-border/30">
              <div class="bg-muted/60 rounded h-4 animate-shimmer" :style="{ width: `${Math.random() * 40 + 60}px`, animationDelay: `${n * 0.1 + 0.5}s` }"></div>
            </td>
            <!-- Date column -->
            <td class="py-4 px-6 border-b border-border/30">
              <div class="bg-muted/60 rounded h-4 w-32 animate-shimmer" :style="{ animationDelay: `${n * 0.1 + 0.6}s` }"></div>
            </td>
            <!-- Actions column -->
            <td class="py-4 px-6 border-b border-border/30">
              <div class="bg-muted/60 rounded h-4 w-20 animate-shimmer" :style="{ animationDelay: `${n * 0.1 + 0.7}s` }"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.animate-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

/* Dark mode shimmer effect */
@media (prefers-color-scheme: dark) {
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  }
}

/* Glassmorphism effect */
.bg-card\/80 {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
