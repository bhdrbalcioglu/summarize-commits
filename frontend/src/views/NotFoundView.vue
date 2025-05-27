<!-- frontend/src/views/NotFoundView.vue -->
<template>
  <div class="flex flex-col items-center justify-center min-h-screen text-center p-8">
    <h1 class="text-6xl font-bold text-gray-700">404</h1>
    <p class="text-2xl text-gray-600 mt-4">Page Not Found</p>
    <p class="mt-2 text-gray-500">Sorry, the page you are looking for does not exist.</p>
    <router-link to="/" class="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"> Go Home </router-link>
  </div>
</template>

<script setup lang="ts">
// No specific script needed for a simple 404 page
</script>
