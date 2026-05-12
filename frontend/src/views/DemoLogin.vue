<template>
  <div class="login-wrapper">
    <div class="login-container">      <div class="brand-section">
        <div class="logo-circle">🚴</div>
        <h1>Fietsvergoeding</h1>
        <p>Proof of Concept Login</p>
      </div>

      <form @submit.prevent="submitLoginForm">
        <div class="roles-grid">
          <button type="button" @click="selectUser(1)" :class="['role-card', selectedUserId === 1 ? 'selected' : '']">
            <div class="role-icon belgium">🇧🇪</div>
            <div class="role-info">
              <h3>Werknemer BE</h3>
              <span class="role-desc">Fietsvergoeding + Limiet</span>
            </div>
            <div class="arrow">➜</div>
          </button>

          <button type="button" @click="selectUser(2)" :class="['role-card', selectedUserId === 2 ? 'selected' : '']">
            <div class="role-icon netherlands">🇳🇱</div>
            <div class="role-info">
              <h3>Werknemer NL</h3>
              <span class="role-desc">Eigen Fiets (Onbelast)</span>
            </div>
            <div class="arrow">➜</div>
          </button>

          <button type="button" @click="selectUser(3)" :class="['role-card', selectedUserId === 3 ? 'selected' : '']">
            <div class="role-icon admin">⚙️</div>
            <div class="role-info">
              <h3>Admin</h3>
              <span class="role-desc">Instellingen & Beheer</span>
            </div>
            <div class="arrow">➜</div>
          </button>

          <button type="button" @click="selectUser(4)" :class="['role-card', selectedUserId === 4 ? 'selected' : '']">
            <div class="role-icon payroll">📊</div>
            <div class="role-info">
              <h3>Payroll</h3>
              <span class="role-desc">Export & Financiën</span>
            </div>
            <div class="arrow">➜</div>
          </button>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" v-model="akkoord" required />
            <span>Ik ga akkoord met de <a href="#" tabindex="-1">regels en privacyverklaring</a></span>
          </label>
        </div>

        <div class="form-group">
          <label>Handtekening (teken hieronder):</label>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
            <SignaturePad v-model="signature" :width="sigWidth" :height="sigHeight" />
            <div style="display:flex;flex-direction:column;gap:0.3rem;">
              <button type="button" @click="sigWidth+=40" style="font-size:0.9em;">➕ Breder</button>
              <button type="button" @click="sigHeight+=20" style="font-size:0.9em;">➕ Hoger</button>
            </div>
          </div>
          <div v-if="signature" style="font-size:0.85em;color:#888;margin-top:0.3rem;">✓ Handtekening geregistreerd</div>
        </div>

        <button type="submit" class="btn-primary full-width-btn">Inloggen</button>
      </form>

      <div class="user-list-section" v-if="users.length">
        <h2>Alle gebruikers</h2>
        <div class="user-list">
          <button type="button" v-for="u in users" :key="u.id" @click="selectUser(u.id)" :class="['user-btn', selectedUserId === u.id ? 'selected' : '']">
            <span class="user-avatar">{{ u.name.charAt(0) }}</span>
            <span class="user-name">{{ u.name }}</span>
            <span class="user-role">{{ u.role }}</span>
            <span class="user-country">{{ u.country }}</span>
          </button>
        </div>
      </div>

      <div v-if="error" class="error-msg">⚠️ {{ error }}</div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../store";
import SignaturePad from '../components/SignaturePad.vue';

const router = useRouter();
const userStore = useUserStore();
const error = ref("");
const users = ref([]);
const akkoord = ref(false);
const signature = ref("");
const selectedUserId = ref(null);
const sigWidth = ref(320);
const sigHeight = ref(100);

async function fetchDemoUsers() {
  try {
    const res = await fetch("http://localhost:3001/employees", {
      headers: userStore.getAuthHeaders(false)
    });
    if (!res.ok) return;
    users.value = await res.json();
  } catch (e) {
    // fallback: geen users
    users.value = [];
  }
}


function selectUser(id) {
  selectedUserId.value = id;
}

async function submitLoginForm() {
  error.value = '';
  if (!akkoord.value) {
    error.value = 'Je moet akkoord gaan met de regels.';
    return;
  }
  if (!signature.value || signature.value.length < 100) {
    error.value = 'Gelieve een handtekening te plaatsen.';
    return;
  }
  if (!selectedUserId.value) {
    error.value = 'Selecteer een gebruiker of rol.';
    return;
  }
  const result = await userStore.login(selectedUserId.value);
  if (result.ok && userStore.user) {
    const role = userStore.user.role;
    if (role === 'EMPLOYEE') router.push('/employee');
    else if (role === 'ADMIN') router.push('/admin');
    else router.push('/payroll');
  } else {
    if (result?.error === 'DEMO_MODE_DISABLED') error.value = "Demo mode staat uit op de backend.";
    else if (result?.error === 'NETWORK_ERROR') error.value = "Kan backend niet bereiken.";
    else error.value = "Kan niet inloggen.";
  }
}

onMounted(fetchDemoUsers);
</script>
