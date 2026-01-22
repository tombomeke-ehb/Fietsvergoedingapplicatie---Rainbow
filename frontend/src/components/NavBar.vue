<template>
  <nav v-if="userStore.user" class="navbar">
    <div class="nav-brand">🚲 Fietsvergoeding</div>
    <div class="nav-user">
      <span>{{ userStore.user.name }} ({{ userStore.user.country }})</span>
      <button @click="handleLogout" class="btn-logout">Uitloggen</button>
    </div>
  </nav>
</template>

<script setup>
import { useUserStore } from '../store';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

function handleLogout() {
  userStore.logout();
  router.push('/');
}
</script>