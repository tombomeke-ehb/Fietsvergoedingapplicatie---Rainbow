<!-- frontend/src/App.vue -->
<script setup>
import NavBar from './components/NavBar.vue';
import { useUserStore } from './store';
import { onMounted } from 'vue';

const userStore = useUserStore();

onMounted(() => {
  // Try to restore session on app load
  userStore.fetchMe();
});
</script>

<template>
  <div class="app-container">
    <NavBar />
    <router-view />
  </div>
</template>

<style>
/* Import global styles - note: this is in a non-scoped style block */
@import './style.css';
</style>
