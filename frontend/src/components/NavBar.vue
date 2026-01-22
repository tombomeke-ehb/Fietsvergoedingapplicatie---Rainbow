<template>
  <nav v-if="userStore.user" class="navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <span class="brand-icon">🚴</span>
        <span class="brand-text">EcoTravel<span class="brand-suffix">ERP</span></span>
      </div>
      
      <div class="nav-actions">
        <!-- Role Badge -->
        <div class="role-badge" :class="userStore.user.role.toLowerCase()">
          {{ userStore.user.role }}
        </div>

        <div class="divider"></div>

        <div class="user-profile">
          <div class="text-group">
            <span class="user-name">{{ userStore.user.name }}</span>
            <span class="user-country">{{ userStore.user.country }}</span>
          </div>
          <div class="avatar">
            {{ userStore.user.name.charAt(0).toUpperCase() }}
          </div>
        </div>
        
        <button @click="handleLogout" class="btn-logout" title="Uitloggen">
          <span class="logout-icon">⏻</span>
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
  background: white;
  height: 64px;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06);
}

.nav-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2D3748;
  letter-spacing: -0.025em;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-text {
  color: #1A202C;
}

.brand-suffix {
  color: var(--primary);
  margin-left: 2px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-badge {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.role-badge.admin { background: #FED7D7; color: #C53030; }
.role-badge.employee { background: #C6F6D5; color: #22543D; }

.divider {
  width: 1px;
  height: 24px;
  background-color: #E2E8F0;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.text-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2D3748;
}

.user-country {
  font-size: 0.75rem;
  color: #718096;
}

.avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #2F855A 0%, #276749 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(47, 133, 90, 0.2);
}

.btn-logout {
  background: transparent;
  border: none;
  color: #A0AEC0;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-logout:hover {
  background-color: #FFF5F5;
  color: #E53E3E;
  transform: translateX(2px);
}
</style>