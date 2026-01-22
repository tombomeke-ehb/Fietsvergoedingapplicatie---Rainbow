<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🚲 Fietsvergoeding Systeem</h1>
        <p class="login-subtitle">Selecteer een rol om de Proof of Concept te testen</p>
      </div>
      
      <div class="login-grid">
        <button @click="handleLogin(1)" class="login-btn">
          <div class="login-icon">👤</div>
          <h3>Werknemer BE</h3>
          <small>Limiet + Blokkeren</small>
        </button>
        <button @click="handleLogin(2)" class="login-btn">
          <div class="login-icon">👤</div>
          <h3>Werknemer NL</h3>
          <small>Eigen Fiets (Onbelast)</small>
        </button>
        <button @click="handleLogin(3)" class="login-btn">
          <div class="login-icon">⚙️</div>
          <h3>Admin</h3>
          <small>Settings & Export</small>
        </button>
        <button @click="handleLogin(4)" class="login-btn">
          <div class="login-icon">📊</div>
          <h3>Payroll</h3>
          <small>Lijsten & Download</small>
        </button>
      </div>
      
      <p v-if="error" class="msg-error">⚠️ {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store';

const router = useRouter();
const userStore = useUserStore();
const error = ref('');

async function handleLogin(id) {
  error.value = '';
  await userStore.login(id);
  
  if (userStore.user) {
    const role = userStore.user.role;
    if (role === 'EMPLOYEE') router.push('/employee');
    else if (role === 'ADMIN') router.push('/admin');
    else router.push('/payroll');
  } else {
    error.value = "Kan niet inloggen. Backend offline?";
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #2F855A 0%, #276749 100%);
}

.login-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 3rem;
  max-width: 700px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-header h1 {
  color: var(--secondary);
  margin-bottom: 0.5rem;
  font-size: 2.25rem;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

.login-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

@media (max-width: 640px) {
  .login-card {
    padding: 2rem 1.5rem;
  }
  
  .login-header h1 {
    font-size: 1.75rem;
  }
}
</style>