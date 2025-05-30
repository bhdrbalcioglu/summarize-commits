<!-- frontend/src/components/UserDropdownMenu.vue -->
<template>
  <DropdownMenu>
    <!-- Dropdown Trigger -->
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        class="relative h-10 w-auto px-3 rounded-full hover:bg-accent/50 focus:bg-accent/50 transition-colors border border-border/30 hover:border-border/50"
      >
        <div class="flex items-center space-x-3">
          <!-- Avatar -->
          <Avatar class="h-8 w-8 ring-2 ring-border/30">
            <AvatarImage
              :src="authStore.user?.avatar_url || ''"
              :alt="`${authStore.user?.name || 'User'}'s avatar`"
            />
            <AvatarFallback class="bg-primary/10 text-primary font-semibold text-sm">
              {{ avatarFallback }}
            </AvatarFallback>
          </Avatar>
          
          <!-- User Name & Chevron -->
          <div class="hidden md:flex items-center space-x-2">
            <span class="text-foreground font-medium text-sm truncate max-w-32">
              {{ authStore.user?.name || 'User' }}
            </span>
            <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
        </div>
      </Button>
    </DropdownMenuTrigger>

    <!-- Dropdown Content -->
    <DropdownMenuContent 
      class="w-64 mr-4 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl"
      align="end"
    >
      <!-- User Info Header -->
      <div class="px-4 py-3 border-b border-border/50">
        <div class="flex items-center space-x-3">
          <Avatar class="h-10 w-10">
            <AvatarImage
              :src="authStore.user?.avatar_url || ''"
              :alt="`${authStore.user?.name || 'User'}'s avatar`"
            />
            <AvatarFallback class="bg-primary/10 text-primary-foreground font-semibold">
              {{ avatarFallback }}
            </AvatarFallback>
          </Avatar>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-foreground truncate">
              {{ authStore.user?.name || 'User' }}
            </p>
            <p class="text-xs text-muted-foreground truncate">
              {{ authStore.user?.email || authStore.user?.username || '' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Profile Menu Item -->
      <DropdownMenuItem as-child>
        <router-link
          to="/user"
          class="flex items-center space-x-3 px-4 py-3 text-sm hover:bg-accent focus:bg-accent cursor-pointer transition-colors"
        >
          <User class="h-4 w-4 text-muted-foreground" />
          <span>View Profile</span>
        </router-link>
      </DropdownMenuItem>

      <DropdownMenuSeparator class="bg-border/50" />

      <!-- Dark Mode Section -->
      <div class="px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <Palette class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">Dark Mode</span>
          </div>
          <DarkModeToggle />
        </div>
      </div>

      <DropdownMenuSeparator class="bg-border/50" />

      <!-- Logout Item -->
      <DropdownMenuItem
        class="flex items-center space-x-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer transition-colors"
        @click="handleLogout"
      >
        <LogOut class="h-4 w-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
import { User, LogOut, Palette, ChevronDown } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

// Compute avatar fallback initials
const avatarFallback = computed(() => {
  const name = authStore.user?.name || authStore.user?.username || 'U'
  const words = name.trim().split(' ')
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    // authStore.logout() already handles redirect to home
  } catch (error) {
    console.error('Logout failed:', error)
    // Still redirect even if logout request fails
    router.push('/')
  }
}
</script>

<style scoped>
/* Additional styles for smooth transitions */
.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Router link active state handling */
.router-link-active {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
</style> 