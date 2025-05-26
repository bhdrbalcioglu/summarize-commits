<template>
  <div>
    <Header />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import Header from './components/Header.vue'
import { RouterView } from 'vue-router'
</script>
