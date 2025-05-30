<template>
  <div class="overflow-x-auto">
    <table class="w-full bg-card border border-border rounded-lg overflow-hidden">
      <thead class="bg-muted/50">
        <tr>
          <th v-for="m in 5" :key="'header-cell-' + m" class="py-4 px-6 border-b border-border text-center">
            <div class="bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/20 to-muted-foreground/10 h-4 rounded animate-shimmer bg-[length:200%_100%]"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="n in rows" :key="'skeleton-row-' + n" class="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
          <td class="py-4 px-6 text-center">
            <div class="bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/20 to-muted-foreground/10 h-4 rounded animate-shimmer bg-[length:200%_100%]" :style="{ animationDelay: `${n * 0.1}s` }"></div>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/20 to-muted-foreground/10 h-4 rounded animate-shimmer bg-[length:200%_100%] w-3/4" :style="{ animationDelay: `${n * 0.1 + 0.2}s` }"></div>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/20 to-muted-foreground/10 h-4 rounded animate-shimmer bg-[length:200%_100%] w-5/6" :style="{ animationDelay: `${n * 0.1 + 0.4}s` }"></div>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/20 to-muted-foreground/10 h-4 rounded animate-shimmer bg-[length:200%_100%] w-2/3" :style="{ animationDelay: `${n * 0.1 + 0.6}s` }"></div>
          </td>
          <td class="py-4 px-6 text-center">
            <div class="bg-gradient-to-r from-muted-foreground/10 via-muted-foreground/20 to-muted-foreground/10 h-4 rounded animate-shimmer bg-[length:200%_100%] w-1/2" :style="{ animationDelay: `${n * 0.1 + 0.8}s` }"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number
  cols?: number
}

withDefaults(defineProps<Props>(), {
  rows: 5,
  cols: 3
})
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}
</style>
