<template>
  <div>
    <p class="text-3xl text-retro-black text-center font-bold">Authenticating with GitLab...</p>
    <p v-if="errorMessage" class="text-retro-dark-gray">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'
const errorMessage = ref('')
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const clientId = import.meta.env.VITE_GITLAB_CLIENT_ID
const clientSecret = import.meta.env.VITE_GITLAB_CLIENT_SECRET
const redirectUri = import.meta.env.VITE_GITLAB_REDIRECT_URI

const fetchData = async () => {
  const code = route.query.code
  if (!code) {
    errorMessage.value = 'Authorization code not found.'
    return
  }

  const tokenRequestData = {
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  }

  try {
    const response = await axios.post('https://gitlab.com/oauth/token', tokenRequestData)
    const accessToken = response.data.access_token
    localStorage.setItem('gitlab_access_token', accessToken)

    authStore.setAuthProvider('GitLab')
    authStore.setAccessToken(accessToken)

    const userResponse = await axios.get('https://gitlab.com/api/v4/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    const userData = userResponse.data
    console.log('userData:', userData)
    userStore.setUser({
      id: userData.id,
      username: userData.username,
      name: userData.name,
      avatar_url: userData.avatar_url,
      email: userData.email,
      state: userData.state,
      location: userData.location,
      created_at: userData.created_at,
      linkedin_url: userData.linkedin || '',
      twitter_url: userData.twitter || '',
      website_url: userData.website || '',
      public_email: userData.public_email || '',
      bio: userData.bio || '',
      skype: userData.skype || '',
      linkedin: userData.linkedin || '',
      twitter: userData.twitter || '',
      website: userData.website || '',
      discord: userData.discord || ''
    })

    router.push('/user')
  } catch (error: any) {
    if (error.response && error.response.data) {
      console.error('Error fetching user data:', (error as AxiosError).response?.data)
      errorMessage.value = 'Failed to fetch user data.'
    } else {
      console.error('Authentication error:', error)
      errorMessage.value = 'Failed to authenticate with GitLab.'
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>
