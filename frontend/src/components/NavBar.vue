<template>
  <nav v-if="userStore.user" class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <div class="brand-logo">🚲</div>
        <span class="brand-text">Fietsvergoeding</span>
      </div>
      
      <div class="nav-actions">
        <!-- Role Badge -->
        <div class="role-badge" :class="userStore.user.role.toLowerCase()">
          {{ userStore.user.role }}
        </div>

        <div class="divider"></div>

        <div class="user-profile">
          <div class="avatar">
            {{ userStore.user.name.charAt(0).toUpperCase() }}
          </div>
          <div class="text-group">
            <span class="user-name">{{ userStore.user.name }}</span>
            <span class="user-country">{{ userStore.user.country }}</span>
          </div>
        </div>
        
        <button @click="handleLogout" class="btn-logout" title="Uitloggen">
          <span class="logout-text">Uitloggen</span>
          <span class="logout-icon">➜</span>
        </button>
      </div>
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

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  height: 70px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.nav-container {
  width: 100%;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.btn-home {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-home:hover {
  background: #F7FAFC;
  transform: scale(1.1);
}

.brand-logo {
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(47, 133, 90, 0.3);
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1A202C;
  letter-spacing: -0.03em;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.role-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  border-radius: 99px;
  letter-spacing: 0.05em;
  box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
}

.role-badge.admin { 
  background: #FFF5F5; 
  color: #C53030; 
  border: 1px solid #FEB2B2;
}

.role-badge.employee { 
  background: #F0FFF4; 
  color: #2F855A; 
  border: 1px solid #9AE6B4;
}

.role-badge.payroll { 
  background: #FAF5FF; 
  color: #553C9A; 
  border: 1px solid #D6BCFA;
}

.divider {
  width: 1px;
  height: 32px;
  background-color: #E2E8F0;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-profile:hover {
  background: #F7FAFC;
}

.text-group {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2D3748;
}

.user-country {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 500;
}

.avatar {
  width: 40px;
  height: 40px;
  background: white;
  color: var(--primary);
  border: 2px solid var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.btn-logout {
  background: #EDF2F7;
  border: none;
  color: #4A5568;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-logout:hover {
  background-color: #FED7D7;
  color: #C53030;
}
</style>