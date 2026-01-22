<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="brand-section">
        <div class="logo-circle">🚴</div>
        <h1>Fietsvergoeding</h1>
        <p>Proof of Concept Login</p>
      </div>

      <div class="roles-grid">
        <button @click="handleLogin(1)" class="role-card">
          <div class="role-icon belgium">🇧🇪</div>
          <div class="role-info">
            <h3>Werknemer BE</h3>
            <span class="role-desc">Fietsvergoeding + Limiet</span>
          </div>
          <div class="arrow">➜</div>
        </button>

        <button @click="handleLogin(2)" class="role-card">
          <div class="role-icon netherlands">🇳🇱</div>
          <div class="role-info">
            <h3>Werknemer NL</h3>
            <span class="role-desc">Eigen Fiets (Onbelast)</span>
          </div>
          <div class="arrow">➜</div>
        </button>

        <button @click="handleLogin(3)" class="role-card">
          <div class="role-icon admin">⚙️</div>
          <div class="role-info">
            <h3>Admin</h3>
            <span class="role-desc">Instellingen & Beheer</span>
          </div>
          <div class="arrow">➜</div>
        </button>

        <button @click="handleLogin(4)" class="role-card">
          <div class="role-icon payroll">📊</div>
          <div class="role-info">
            <h3>Payroll</h3>
            <span class="role-desc">Export & Financiën</span>
          </div>
          <div class="arrow">➜</div>
        </button>
      </div>

      <p v-if="error" class="error-msg">⚠️ {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../store";

const router = useRouter();
const userStore = useUserStore();
const error = ref("");

async function handleLogin(id) {
  error.value = "";
  try {
    await userStore.login(id);
    if (userStore.user) {
      const role = userStore.user.role;
      if (role === "EMPLOYEE") router.push("/employee");
      else if (role === "ADMIN") router.push("/admin");
      else router.push("/payroll");
    } else {
      error.value = "Geen verbinding met backend op poort 3001";
    }
  } catch (e) {
    error.value = "Login fout: " + e.message;
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background);
  padding: 1rem;
}

.login-container {
  background: white;
  width: 100%;
  max-width: 480px;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 8px 10px -6px rgba(0, 0, 0, 0.01);
  text-align: center;
}

.brand-section {
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-circle {
  width: 64px;
  height: 64px;
  background: #f0fff4;
  color: #2f855a;
  border-radius: 20px;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px -1px rgba(47, 133, 90, 0.1);
}

h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.025em;
}

p {
  color: #718096;
  font-size: 0.95rem;
  margin: 0;
}

.roles-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.role-card {
  display: flex;
  align-items: center;
  text-align: left;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.role-card:hover {
  transform: translateY(-2px);
  border-color: #2f855a;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  background: #f0fff4;
}

.role-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.role-icon.belgium {
  background: #ebf8ff;
}

.role-icon.netherlands {
  background: #fefcbf;
}

.role-icon.admin {
  background: #edf2f7;
}

.role-icon.payroll {
  background: #e9d8fd;
}

.role-info {
  flex: 1;
}

.role-info h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: #2d3748;
}

.role-desc {
  font-size: 0.8rem;
  color: #718096;
}

.arrow {
  color: #cbd5e0;
  font-weight: bold;
  transition: color 0.2s;
}

.role-card:hover .arrow {
  color: #2f855a;
}

.error-msg {
  margin-top: 1.5rem;
  color: #e53e3e;
  font-size: 0.9rem;
  background: #fff5f5;
  padding: 0.75rem;
  border-radius: 8px;
}
</style>
