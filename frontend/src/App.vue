<!-- frontend/src/App.vue -->
<script setup>
import NavBar from './components/NavBar.vue';
import { useUserStore } from './store';
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

onMounted(() => {
  // Try to restore session on app load
  userStore.fetchMe();
});
</script>

<template>
  <div class="app-container">
    <NavBar />
    
    <div v-if="route.path !== '/'" class="sub-nav">
      <button @click="router.push('/')" class="btn-simple-back">
        ← Terug naar Home
      </button>
    </div>

    <router-view />
  </div>
</template>

<style scoped>
.sub-nav {
  max-width: 1200px;
  width: 100%;
  margin: 1rem auto 0;
  padding: 0 1.5rem;
}

.btn-simple-back {
  background: white;
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 0.6rem 1.2rem;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 700;
  color: var(--secondary);
  font-size: 0.9rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}

.btn-simple-back:hover {
  color: var(--primary);
  border-color: var(--primary);
  background: white;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(47, 133, 90, 0.15);
}
</style>

<style>
/* Import global styles - note: this is in a non-scoped style block */
@import './style.css';
</style>
