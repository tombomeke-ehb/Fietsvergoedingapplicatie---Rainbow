<template>
  <div class="card">
    <h1>Demo Login</h1>
    <p>Selecteer een rol om de Proof of Concept te testen.</p>
    
    <div class="login-grid">
      <button @click="handleLogin(1)" class="login-btn">
        <h3>Werknemer BE</h3>
        <small>Limiet + Blokkeren</small>
      </button>
      <button @click="handleLogin(2)" class="login-btn">
        <h3>Werknemer NL</h3>
        <small>Eigen Fiets (Onbelast)</small>
      </button>
      <button @click="handleLogin(3)" class="login-btn">
        <h3>Admin</h3>
        <small>Settings & Export</small>
      </button>
      <button @click="handleLogin(4)" class="login-btn">
        <h3>Payroll</h3>
        <small>Lijsten & Download</small>
      </button>
    </div>
    <p v-if="error" class="msg-error">{{ error }}</p>
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