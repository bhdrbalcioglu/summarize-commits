<template>
  <div class="min-h-screen relative">
    <!-- Gradient Background System (matching home page) -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-background/80 to-transparent"></div>

    <!-- Animated Background Orbs -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>

    <div class="relative z-10 p-6 min-h-screen">
      <div class="max-w-7xl mx-auto">
        <!-- Main Layout: Profile Left, Navigation Right -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <!-- Profile Tab (Left Side - Takes 2/5 of width on large screens) -->
          <div v-motion :initial="{ opacity: 0, x: -50 }" :enter="{ opacity: 1, x: 0, transition: { duration: 600 } }" class="lg:col-span-2">
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
                    <img v-if="authStore.user.avatar_url" :src="authStore.user.avatar_url" alt="Profile Image" class="w-32 h-32 rounded-full border-4 border-primary/20 shadow-xl hover:scale-105 transition-transform duration-300" />
                    <div v-else class="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-muted-foreground text-5xl border-4 border-primary/20 shadow-xl">
                      <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <!-- User Name with Gradient Text -->
                  <h1 class="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-foreground to-secondary bg-clip-text text-primary text-center">
                    {{ authStore.user.name }}
                  </h1>

                  <!-- Username -->
                  <p class="text-xl md:text-2xl text-muted-foreground mb-4 text-center">@{{ authStore.user.username }}</p>

                  <!-- Provider Badge -->
                  <div class="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6">
                    <svg v-if="authStore.user.provider === 'github'" class="w-5 h-5 mr-2 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else-if="authStore.user.provider === 'gitlab'" class="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M19.13 10.13l-1.07-3.28L16.8 2.7a.426.426 0 00-.81 0l-1.26 4.15H5.27L4.01 2.7a.426.426 0 00-.81 0L1.94 6.85.87 10.13a.851.851 0 00.31.95l9.32 6.77a.426.426 0 00.5 0l9.32-6.77a.851.851 0 00.31-.95z" />
                    </svg>
                    <span class="text-sm font-semibold text-foreground capitalize"> {{ authStore.user.provider }} Account </span>
                  </div>
                </div>

                <!-- User Details - Vertical Stack -->
                <div class="space-y-3 mb-2">
                  <!-- Email Card -->
                  <div v-if="authStore.user.email" class="bg-card/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span class="text-sm font-medium">Email</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">{{ authStore.user.email }}</p>
                  </div>

                  <!-- Location Card -->
                  <div v-if="currentUserDetails?.location" class="bg-card/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
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
                  <div v-if="currentUserDetails?.created_at" class="bg-card/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
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

                  <!-- Company Card -->
                  <div v-if="currentUserDetails?.company" class="bg-card/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span class="text-sm font-medium">Company</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">{{ currentUserDetails.company }}</p>
                  </div>

                  <!-- Job Title Card (GitLab) -->
                  <div v-if="currentUserDetails?.job_title" class="bg-card/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0h2.5A1.5 1.5 0 0121 7.5V11" />
                      </svg>
                      <span class="text-sm font-medium">Job Title</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">{{ currentUserDetails.job_title }}</p>
                  </div>

                  <!-- Public Repositories Card (GitHub) -->
                  <div v-if="currentUserDetails?.public_repos !== undefined" class="bg-card/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span class="text-sm font-medium">Public Repos</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">{{ currentUserDetails.public_repos }}</p>
                  </div>

                  <!-- Followers Card -->
                  <div v-if="currentUserDetails?.followers !== undefined" class="bg-card/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span class="text-sm font-medium">Followers</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">{{ currentUserDetails.followers }}</p>
                  </div>

                  <!-- Following Card -->
                  <div v-if="currentUserDetails?.following !== undefined" class="bg-card/40 backdrop-blur-sm rounded-xl p-1 border border-border/30">
                    <div class="flex items-center text-muted-foreground mb-2">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span class="text-sm font-medium">Following</span>
                    </div>
                    <p class="text-foreground font-medium text-sm">{{ currentUserDetails.following }}</p>
                  </div>
                </div>

                <!-- Enhanced Bio Section -->
                <div v-if="currentUserDetails?.bio" class="mb-8">
                  <div class="bg-card/40 backdrop-blur-sm rounded-xl p-2 border border-border/30">
                    <h4 class="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Bio
                    </h4>
                    <p class="text-muted-foreground leading-relaxed">{{ currentUserDetails.bio }}</p>
                  </div>
                </div>

                <!-- Social Media & Links Section -->
                <div v-if="hasSocialLinks" class="mb-8">
                  <div class="bg-card/40 backdrop-blur-sm rounded-xl p-2 border border-border/30">
                    <h4 class="text-lg font-semibold text-foreground mb-4 flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Links & Social
                    </h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <!-- Website Link -->
                      <a v-if="currentUserDetails?.website_url" :href="currentUserDetails.website_url" target="_blank" rel="noopener noreferrer" class="flex items-center px-4 py-2 bg-secondary/10 hover:bg-secondary/20 rounded-lg transition-colors text-sm">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        Website
                      </a>

                      <!-- Twitter Link -->
                      <a v-if="currentUserDetails?.twitter_username" :href="`https://twitter.com/${currentUserDetails.twitter_username}`" target="_blank" rel="noopener noreferrer" class="flex items-center px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors text-sm">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        @{{ currentUserDetails.twitter_username }}
                      </a>

                      <!-- LinkedIn Link (GitLab) -->
                      <a v-if="currentUserDetails?.linkedin" :href="currentUserDetails.linkedin" target="_blank" rel="noopener noreferrer" class="flex items-center px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 rounded-lg transition-colors text-sm">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>

                      <!-- Discord Link (GitLab) -->
                      <div v-if="currentUserDetails?.discord" class="flex items-center px-4 py-2 bg-indigo-500/10 rounded-lg text-sm">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path
                            d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"
                          />
                        </svg>
                        {{ currentUserDetails.discord }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Professional Info Section (GitLab) -->
                <div v-if="hasProInfo" class="mb-8">
                  <div class="bg-card/40 backdrop-blur-sm rounded-xl p-6 border border-border/30">
                    <h4 class="text-lg font-semibold text-foreground mb-4 flex items-center">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Professional Info
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Pronouns -->
                      <div v-if="currentUserDetails?.pronouns" class="flex items-center">
                        <span class="text-muted-foreground text-sm mr-2">Pronouns:</span>
                        <span class="text-foreground font-medium text-sm">{{ currentUserDetails.pronouns }}</span>
                      </div>

                      <!-- Hireable Status (GitHub) -->
                      <div v-if="currentUserDetails?.hireable !== undefined && currentUserDetails.hireable !== null" class="flex items-center">
                        <span class="text-muted-foreground text-sm mr-2">Available for hire:</span>
                        <span class="text-foreground font-medium text-sm">
                          {{ currentUserDetails.hireable ? 'Yes' : 'No' }}
                        </span>
                      </div>

                      <!-- Public Email (GitLab) -->
                      <div v-if="currentUserDetails?.public_email && currentUserDetails.public_email !== currentUserDetails.email" class="flex items-center">
                        <span class="text-muted-foreground text-sm mr-2">Public Email:</span>
                        <span class="text-foreground font-medium text-sm">{{ currentUserDetails.public_email }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- External Profile Link -->
                <div v-if="authStore.user.web_url" class="flex justify-center">
                  <a :href="authStore.user.web_url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105">
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
                <router-link to="/" class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"> Go to Home </router-link>
              </div>
            </div>
          </div>

          <!-- Navigation Cards (Right Side - Takes 3/5 of width on large screens) -->
          <div v-motion :initial="{ opacity: 0, x: 50 }" :enter="{ opacity: 1, x: 0, transition: { duration: 800, delay: 400 } }" class="lg:col-span-3 flex flex-col gap-6">
            <!-- Projects Tab -->
            <div class="group bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 hover:border-secondary/30 transition-all duration-500 p-6 transform-gpu flex flex-col flex-1">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="w-12 h-12 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-6 h-6 text-green-500 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent group-hover:from-green-400 group-hover:to-teal-400 transition-all">Projects</h3>
                    <div class="flex items-center text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span class="text-xs font-medium">Recent Activity</span>
                    </div>
                  </div>
                </div>

                <!-- Status indicator -->
                <div class="flex items-center space-x-2">
                  <div v-if="projectListStore.isLoadingLatestProjects" class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <div v-else-if="projectListStore.hasLatestProjects" class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div v-else class="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span class="text-xs text-muted-foreground font-medium">
                    {{ projectListStore.isLoadingLatestProjects ? 'Loading...' : projectListStore.hasLatestProjects ? 'Active' : 'No Projects' }}
                  </span>
                </div>
              </div>

              <!-- Projects List -->
              <div class="space-y-3 mb-4 flex-1 overflow-y-auto">
                <!-- Loading State -->
                <div v-if="projectListStore.isLoadingLatestProjects" class="space-y-3">
                  <div v-for="i in 3" :key="i" class="bg-card/40 backdrop-blur-sm rounded-xl p-4 border border-border/30 animate-pulse">
                    <div class="flex items-center space-x-3">
                      <div class="w-5 h-5 bg-muted/60 rounded"></div>
                      <div class="flex-1 space-y-2">
                        <div class="h-4 bg-muted/60 rounded w-3/4"></div>
                        <div class="h-3 bg-muted/60 rounded w-1/2"></div>
                      </div>
                      <div class="h-3 bg-muted/60 rounded w-16"></div>
                    </div>
                  </div>
                </div>

                <!-- Projects List -->
                <div v-else-if="projectListStore.hasLatestProjects" class="space-y-3">
                  <CompactProjectCard v-for="project in projectListStore.latestProjects" :key="project.id" :project="project" />
                </div>

                <!-- Empty State -->
                <div v-else-if="!projectListStore.isLoadingLatestProjects" class="text-center py-6">
                  <svg class="w-12 h-12 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p class="text-muted-foreground text-sm mb-2">No projects found</p>
                  <p class="text-muted-foreground text-xs">Start by connecting your repositories</p>
                </div>

                <!-- Error State -->
                <div v-if="projectListStore.latestProjectsError" class="text-center py-4">
                  <svg class="w-8 h-8 text-destructive mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p class="text-destructive text-sm">{{ projectListStore.latestProjectsError }}</p>
                </div>
              </div>

              <!-- See All Projects Button -->
              <div class="flex justify-center pt-2 border-t border-border/30 mt-auto">
                <router-link to="/projects" class="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  See All Projects
                </router-link>
              </div>
            </div>

            <!-- Groups/Organizations Tab -->
            <router-link to="/groups" class="group block bg-card/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/30 hover:border-primary/30 transition-all duration-500 p-6 hover:scale-105 hover:shadow-3xl transform-gpu flex-1">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-blue-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent group-hover:from-blue-400 group-hover:to-purple-400 transition-all">Groups / Organizations</h3>
                  <div class="flex items-center text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="text-xs font-medium">Explore Teams</span>
                  </div>
                </div>
              </div>

              <p class="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors mb-4">Manage your collaborative workspaces and team repositories. Access shared projects and coordinate with your teammates.</p>

              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span class="text-xs text-green-600 font-medium">Active Teams</span>
                </div>
                <div class="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold group-hover:bg-primary/20 transition-colors">View All</div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Additional Quick Actions (Optional Enhancement) -->
        <div v-motion :initial="{ opacity: 0, y: 30 }" :enter="{ opacity: 1, y: 0, transition: { duration: 600, delay: 800 } }" class="mt-12 text-center">
          <div class="bg-card/40 backdrop-blur-sm rounded-2xl border border-border/30 p-6 max-w-2xl mx-auto">
            <h4 class="text-lg font-semibold text-foreground mb-3">Quick Start</h4>
            <p class="text-muted-foreground mb-4">New to commit summarization? Start by connecting a repository and watch AI transform your commits into professional release notes.</p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <router-link to="/projects" class="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Connect Repository
              </router-link>
              <router-link to="/" class="inline-flex items-center px-6 py-3 bg-card border border-border text-foreground rounded-xl hover:bg-card/80 transition-colors font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform">
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
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useProjectListStore } from '../stores/projectListStore'
import CompactProjectCard from '../components/CompactProjectCard.vue'
import type { User } from '../stores/userStore' // Import User type from userStore

const authStore = useAuthStore()
const projectListStore = useProjectListStore()

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

// Computed property to check if user has social media links
const hasSocialLinks = computed(() => {
  const user = currentUserDetails.value
  return !!(user?.website_url || user?.twitter_username || user?.linkedin || user?.discord)
})

// Computed property to check if user has professional information
const hasProInfo = computed(() => {
  const user = currentUserDetails.value
  return !!(user?.pronouns || (user?.hireable !== undefined && user?.hireable !== null) || (user?.public_email && user?.public_email !== user?.email))
})

onMounted(async () => {
  if (!authStore.isUserAuthenticated && !authStore.isLoading) {
    await authStore.fetchCurrentUser()
  }
  // Fetch latest projects if user is authenticated and we haven't loaded them yet
  if (authStore.isUserAuthenticated && !projectListStore.isLoadingLatest && projectListStore.latestProjects.length === 0) {
    await projectListStore.fetchLatestProjects()
  }
})
</script>
