<template>
  <div class="page">
    <h1>Demo Login</h1>
    <p>Kies een demo user om de flow te tonen.</p>

    <div class="buttons">
      <button @click="login(1)">Employee BE</button>
      <button @click="login(2)">Employee NL (Own)</button>
      <button @click="login(3)">Admin</button>
      <button @click="login(4)">Payroll</button>
    </div>

    <div v-if="me" class="card">
      <h2>Ingelogd als</h2>
      <p><b>{{ me.name }}</b></p>
      <p>{{ me.role }} – {{ me.country }} <span v-if="me.bikeType">({{ me.bikeType }})</span></p>
      <button @click="goToDashboard()">Ga naar dashboard</button>
      <button class="secondary" @click="logout()">Logout</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const me = ref(null);
const error = ref("");

const API = "http://localhost:3001";

async function fetchMe() {
  const id = localStorage.getItem("demoUserId");
  if (!id) return;

  const res = await fetch(`${API}/me`, {
    headers: { "x-demo-user-id": id }
  });

  if (!res.ok) {
    me.value = null;
    error.value = "Kon /me niet ophalen. Backend running?";
    return;
  }

  me.value = await res.json();
}

function routeForRole(role) {
  if (role === "EMPLOYEE") return "/employee";
  if (role === "ADMIN") return "/admin";
  return "/payroll";
}

async function login(userId) {
  error.value = "";
  localStorage.setItem("demoUserId", String(userId));
  await fetchMe();
}

function goToDashboard() {
  if (!me.value) return;
  router.push(routeForRole(me.value.role));
}

function logout() {
  localStorage.removeItem("demoUserId");
  me.value = null;
}

fetchMe();
</script>

<style scoped>
.page {
  max-width: 700px;
  margin: 40px auto;
  padding: 24px;
  font-family: system-ui, sans-serif;
}
.buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 16px 0 24px;
}
button {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #444;
  background: #1e1e1e;
  color: white;
  cursor: pointer;
}
button.secondary {
  background: transparent;
}
.card {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #444;
  border-radius: 14px;
}
.error {
  margin-top: 14px;
  color: #ff6b6b;
}
</style>
