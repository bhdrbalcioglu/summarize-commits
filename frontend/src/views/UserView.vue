<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Gradient Background System (matching home page) -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-background/80 to-transparent"></div>
    
    <!-- Animated Background Orbs -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    
    <div class="relative z-10 p-6 min-h-screen">
      <div class="max-w-7xl mx-auto">
        
        <!-- Main Layout: Profile Left, Navigation Right -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[80vh]">
          
          <!-- Profile Tab (Left Side - Takes 2/3 of width on large screens) -->
          <div 
            v-motion
            :initial="{ opacity: 0, x: -50 }"
            :enter="{ opacity: 1, x: 0, transition: { duration: 600 } }"
            class="lg:col-span-2"
          >
            <div v-if="authStore.isLoading && !authStore.user" class="h-full flex items-center justify-center">
              <div class="bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 p-8 text-center">
                <div class="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                <p class="text-muted-foreground text-lg">Loading your profile...</p>
              </div>
            </div>
            
            <div v-else-if="authStore.user" class="h-full">
              <!-- Profile Hero Card with Glassmorphism -->
              <div class="bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 hover:border-primary/20 transition-all duration-500 p-8 md:p-12 h-full flex flex-col justify-center">
                
                <!-- Avatar Section -->
                <div class="flex flex-col items-center mb-8">
                  <div class="relative mb-6">
                    <img 
                      v-if="authStore.user.avatar_url" 
                      :src="authStore.user.avatar_url" 
                      alt="Profile Image" 
                      class="w-32 h-32 rounded-full border-4 border-primary/20 shadow-xl hover:scale-105 transition-transform duration-300" 
                    />
                    <div 
                      v-else 
                      class="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-muted-foreground text-5xl border-4 border-primary/20 shadow-xl"
                    >
                      <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <!-- User Name with Gradient Text -->
                  <h1 class="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-foreground to-secondary bg-clip-text text-transparent text-center">
                    {{ authStore.user.name }}
                  </h1>
                  
                  <!-- Username -->
                  <p class="text-xl md:text-2xl text-muted-foreground mb-4 text-center">@{{ authStore.user.username }}</p>
                  
                  <!-- Provider Badge -->
                  <div class="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6">
                    <svg 
                      v-if="authStore.user.provider === 'github'" 
                      class="w-5 h-5 mr-2 text-gray-700" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
                    </svg>
                    <svg 
                      v-else-if="authStore.user.provider === 'gitlab'" 
                      class="w-5 h-5 mr-2 text-orange-500" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M19.13 10.13l-1.07-3.28L16.8 2.7a.426.426 0 00-.81 0l-1.26 4.15H5.27L4.01 2.7a.426.426 0 00-.81 0L1.94 6.85.87 10.13a.851.851 0 00.31.95l9.32 6.77a.426.426 0 00.5 0l9.32-6.77a.851.851 0 00.31-.95z"/>
                    </svg>
                    <span class="text-sm font-semibold text-foreground capitalize">
                      {{ authStore.user.provider }} Account
                    </span>
                  </div>
                </div>

                <!-- User Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                  
                  <!-- Email Card -->
                  <div v-if="authStore.user.email" class="bg-card/40 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span class="text-sm font-medium">Email</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">{{ authStore.user.email }}</p>
                  </div>

                  <!-- Location Card -->
                  <div v-if="currentUserDetails?.location" class="bg-card/40 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="text-sm font-medium">Location</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">{{ currentUserDetails.location }}</p>
                  </div>

                  <!-- Member Since Card -->
                  <div v-if="currentUserDetails?.created_at" class="bg-card/40 backdrop-blur-sm rounded-xl p-4 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span class="text-sm font-medium">Member Since</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">
                      {{ new Date(currentUserDetails.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
                    </p>
                  </div>
                </div>

                <!-- Bio Section -->
                <div v-if="currentUserDetails?.bio" class="mb-8">
                  <div class="bg-card/40 backdrop-blur-sm rounded-xl p-6 border border-border/30">
                    <h4 class="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Bio
                    </h4>
                    <p class="text-muted-foreground leading-relaxed">{{ currentUserDetails.bio }}</p>
                  </div>
                </div>

                <!-- External Profile Link -->
                <div v-if="authStore.user.web_url" class="flex justify-center">
                  <a 
                    :href="authStore.user.web_url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Profile on {{ authStore.user.provider === 'github' ? 'GitHub' : 'GitLab' }}
                  </a>
                </div>
              </div>
            </div>
            
            <div v-else class="h-full flex items-center justify-center">
              <div class="bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-destructive/20 p-8 text-center">
                <svg class="w-16 h-16 text-destructive mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p class="text-destructive font-semibold mb-2">Profile Unavailable</p>
                <p class="text-muted-foreground mb-4">Could not load your profile. You might not be logged in.</p>
                <router-link 
                  to="/" 
                  class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Go to Home
                </router-link>
              </div>
            </div>
          </div>

          <!-- Navigation Cards (Right Side - Takes 1/3 of width on large screens) -->
          <div 
            v-motion
            :initial="{ opacity: 0, x: 50 }"
            :enter="{ opacity: 1, x: 0, transition: { duration: 800, delay: 400 } }"
            class="lg:col-span-1 flex flex-col gap-6"
          >
            
            <!-- Projects Tab -->
            <router-link 
              to="/projects" 
              class="group block bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 hover:border-secondary/30 transition-all duration-500 p-6 hover:scale-105 hover:shadow-3xl transform-gpu flex-1"
            >
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-green-500 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent group-hover:from-green-400 group-hover:to-teal-400 transition-all">
                    Projects
                  </h3>
                  <div class="flex items-center text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="text-xs font-medium">Browse Repositories</span>
                  </div>
                </div>
              </div>
              
              <p class="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors mb-4">
                Access your personal repositories and projects. Generate professional release notes with AI-powered commit analysis.
              </p>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span class="text-xs text-blue-600 font-medium">Ready to Summarize</span>
                </div>
                <div class="bg-secondary/10 text-secondary px-2 py-1 rounded-full text-xs font-semibold group-hover:bg-secondary/20 transition-colors">
                  Explore
                </div>
              </div>
            </router-link>

            <!-- Groups/Organizations Tab -->
            <router-link 
              to="/groups" 
              class="group block bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 hover:border-primary/30 transition-all duration-500 p-6 hover:scale-105 hover:shadow-3xl transform-gpu flex-1"
            >
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent group-hover:from-blue-400 group-hover:to-purple-400 transition-all">
                    Groups / Organizations
                  </h3>
                  <div class="flex items-center text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="text-xs font-medium">Explore Teams</span>
                  </div>
                </div>
              </div>
              
              <p class="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors mb-4">
                Manage your collaborative workspaces and team repositories. Access shared projects and coordinate with your teammates.
              </p>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-xs text-green-600 font-medium">Active Teams</span>
                </div>
                <div class="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold group-hover:bg-primary/20 transition-colors">
                  View All
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Additional Quick Actions (Optional Enhancement) -->
        <div 
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 800 } }"
          class="mt-12 text-center"
        >
          <div class="bg-card/40 backdrop-blur-sm rounded-2xl border border-border/30 p-6 max-w-2xl mx-auto">
            <h4 class="text-lg font-semibold text-foreground mb-3">Quick Start</h4>
            <p class="text-muted-foreground mb-4">
              New to commit summarization? Start by connecting a repository and watch AI transform your commits into professional release notes.
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <router-link 
                to="/projects" 
                class="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Connect Repository
              </router-link>
              <router-link 
                to="/" 
                class="inline-flex items-center px-6 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-card/80 transition-colors font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn How It Works
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import type { User } from '../stores/userStore' // Import User type from userStore

const authStore = useAuthStore()
// const userStore = useUserStore(); // Only use if it holds data beyond what authStore.user provides

// This computed property assumes that your backend's /api/auth/me returns
// all the necessary user details (including bio, location, created_at etc.)
// and these are typed in the User interface in userStore.ts.
// If userStore was intended to fetch *additional* profile data not present in
// authStore.user, then you would fetch and use userStore.currentUser here.
const currentUserDetails = computed(() => {
  // For now, directly use authStore.user as it should be comprehensive
  return authStore.user as User & {
    // Explicitly type extra fields if they are optional in User but you expect them
    location?: string
    created_at?: string
    bio?: string
    // Add other extended profile fields if applicable from /auth/me response
  }
})

// The showUserStore function was for debugging, can be removed or kept.
// const showUserStore = () => {
//   console.log('Auth Store User:', authStore.user);
//   // console.log('Detailed User Store User:', userStore.currentUser);
// };

// onMounted: Data fetching is handled by authStore.initializeAuth() in main.ts
// or router guards. This view primarily displays the existing auth state.
// If this page could be landed on directly without authStore being initialized,
// you might add:
// onMounted(async () => {
//   if (!authStore.isUserAuthenticated && !authStore.isLoading) {
//     await authStore.fetchCurrentUser();
//   }
//   // If using userStore for additional details:
//   // if (authStore.isUserAuthenticated && !userStore.currentUser && !userStore.isLoading) {
//   //   await userStore.fetchExtendedUserProfile(authStore.user.id);
//   // }
// });
</script>
