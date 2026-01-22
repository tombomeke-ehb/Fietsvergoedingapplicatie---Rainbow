<template>
  <div class="main-content">
    <div class="header-section">
      <h1>⚙️ Admin Dashboard</h1>
      <p class="subtitle">Beheer werknemers, instellingen en exporteer maandelijkse rapporten.</p>
    </div>

    <!-- Quick Actions / Stats Placeholder could go here -->

    <!-- Add New User -->
    <div class="card">
      <h2>Nieuwe gebruiker toevoegen</h2>
      <form @submit.prevent="addUser">
        <label>Naam:
          <input v-model="newUser.name" type="text" required />
        </label>
        <label>Land:
          <select v-model="newUser.country" required>
            <option value="BE">België</option>
            <option value="NL">Nederland</option>
          </select>
        </label>
        <label>Rol:
          <select v-model="newUser.role" required>
            <option value="EMPLOYEE">Werknemer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button type="submit">Gebruiker toevoegen</button>
      </form>
      <p v-if="addUserMsg" class="success">{{ addUserMsg }}</p>
      <p v-if="addUserError" class="error">{{ addUserError }}</p>
    </div>

    <!-- Employee Profile Management -->
    <div class="card">
      <div class="card-header">
        <div class="header-title">
          <h2>👥 Werknemer Stamgegevens</h2>
          <span class="badge badge-blue">{{ employees.length }} Actief</span>
        </div>
        <button @click="fetchEmployees" class="btn-secondary btn-sm icon-btn">
          <span>🔄</span> Verversen
        </button>
      </div>

      <p class="info-text">
        Beheer hier de fietsafstanden en types. Deze data is essentieel voor de maandelijkse berekening.
      </p>

      <div class="table-wrapper">
        <table v-if="employees.length">
          <thead>
            <tr>
              <th width="25%">Werknemer</th>
              <th width="10%">Land</th>
              <th width="15%">Volledig (km)</th>
              <th width="15%">Deels (km)</th>
              <th width="20%">Type Fiets (NL)</th>
              <th width="15%">Actie</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id">
              <td>
                <div class="user-cell">
                  <div class="avatar-circle">{{ emp.name.charAt(0) }}</div>
                  <div>
                    <strong class="user-name">{{ emp.name }}</strong>
                    <div class="user-email">{{ emp.email || "Geen email" }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span :class="['country-badge', emp.country === 'BE' ? 'be-flag' : 'nl-flag']">
                  {{ emp.country === 'BE' ? '🇧🇪 BE' : '🇳🇱 NL' }}
                </span>
              </td>
              <td>
                <div class="input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    v-model.number="emp.profile.fullCommuteKm"
                    class="input-sm"
                    placeholder="0.0"
                  />
                  <span class="unit">km</span>
                </div>
              </td>
              <td>
                <div class="input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    v-model.number="emp.profile.partialCommuteKm"
                    class="input-sm"
                    placeholder="0.0"
                  />
                  <span class="unit">km</span>
                </div>
              </td>
              <td>
                <select
                  v-if="emp.country === 'NL'"
                  v-model="emp.bikeType"
                  class="input-sm bike-select"
                >
                  <option value="OWN">🚲 Eigen (Onbelast)</option>
                  <option value="COMPANY">🏢 Bedrijfs (Belast)</option>
                </select>
                <span v-else class="text-muted text-center block">-</span>
              </td>
              <td>
                <button @click="saveProfile(emp)" class="btn-primary btn-sm save-btn">
                  💾 Opslaan
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="empty-icon">👥</div>
          <p>Geen werknemers gevonden.</p>
        </div>
      </div>
      <transition name="fade">
        <p v-if="profileMsg" class="msg-success">✓ {{ profileMsg }}</p>
      </transition>
      <transition name="fade">
        <p v-if="profileError" class="msg-error">⚠ {{ profileError }}</p>
      </transition>
    </div>

    <div class="dashboard-grid">
      <!-- Country Settings -->
      <div class="card settings-card">
        <div class="card-header no-border">
          <h2>⚙️ Configuratie</h2>
          <select v-model="selectedCountry" @change="fetchSettings" class="country-select">
            <option value="BE">🇧🇪 België</option>
            <option value="NL">🇳🇱 Nederland</option>
          </select>
        </div>

        <form
          v-if="settings"
          @submit.prevent="saveSettings"
          class="settings-form"
        >
          <div class="form-row">
            <div class="form-group half">
              <label>Vergoeding per km</label>
              <div class="input-group">
                <span class="prefix">€</span>
                <input
                  type="number"
                  step="0.01"
                  v-model.number="settings.ratePerKm"
                />
              </div>
            </div>
            
            <div class="form-group half">
              <label>Deadline (dag v/d maand)</label>
              <div class="input-group">
                <span class="prefix">📅</span>
                <input type="number" v-model.number="settings.deadlineDayNextMonth" />
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label>Type Limiet (Cap)</label>
              <select v-model="settings.capType">
                <option value="NONE">🔓 Geen</option>
                <option value="MONTHLY">📅 Maand</option>
                <option value="YEARLY">📆 Jaar</option>
                <option value="BOTH">🔒 Beide</option>
              </select>
            </div>

            <div v-if="['MONTHLY', 'BOTH'].includes(settings.capType)" class="form-group half">
              <label>Maandplafond</label>
              <div class="input-group">
                <span class="prefix">€</span>
                <input type="number" step="0.01" v-model.number="settings.monthlyCapAmount" />
              </div>
            </div>

            <div v-if="['YEARLY', 'BOTH'].includes(settings.capType)" class="form-group half">
               <label>Jaarplafond</label>
               <div class="input-group">
                <span class="prefix">€</span>
                <input type="number" step="0.01" v-model.number="settings.yearlyCapAmount" />
              </div>
            </div>
          </div>

          <div v-if="selectedCountry === 'BE'" class="form-group checkbox-wrapper" style="margin-top: 0.5rem;">
            <label class="switch">
              <input type="checkbox" v-model="settings.beBlockAfterCap" />
              <span class="slider round"></span>
            </label>
            <span class="switch-label">Blokkeren na plafond</span>
          </div>

          <button type="submit" class="btn-primary full-width-btn" style="margin-top: 1rem;">
            💾 Opslaan
          </button>
        </form>
        <transition name="fade">
          <p v-if="settingsMsg" class="msg-success">✓ {{ settingsMsg }}</p>
        </transition>
      </div>

      <!-- Export Processing -->
      <div class="card export-card">
        <h2>🚀 Maandverwerking</h2>
        <p class="text-sm text-secondary">Start de payroll berekening voor de geselecteerde maand.</p>
        
        <div class="export-box">
          <div class="form-group">
            <label>Selecteer Maand</label>
            <input type="month" v-model="exportMonth" class="month-input"/>
          </div>
          <button
            @click="triggerExport"
            class="btn-primary export-btn"
          >
            <span class="icon">⚡</span> Start Export Job
          </button>
        </div>
        
        <div class="info-box">
          <small>ℹ️ Dit proces berekent alle vergoedingen en sluit de periode af.</small>
        </div>

        <transition name="fade">
          <p v-if="exportMsg" class="msg-success">✓ {{ exportMsg }}</p>
        </transition>
        <transition name="fade">
          <p v-if="exportError" class="msg-error">⚠ {{ exportError }}</p>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "../store";

const API = "http://localhost:3001";
const userStore = useUserStore();

const employees = ref([]);
const profileMsg = ref("");
const profileError = ref("");

const newUser = ref({ name: '', country: 'BE', role: 'EMPLOYEE' });
const addUserMsg = ref('');
const addUserError = ref('');

const selectedCountry = ref("BE");
const settings = ref(null);
const settingsMsg = ref('');
const settingsError = ref('');

const exportMonth = ref(new Date().toISOString().slice(0, 7));
const exportMsg = ref("");
const exportError = ref("");

// --- Employees ---
async function fetchEmployees() {
  profileError.value = '';
  try {
    const res = await fetch(`${API}/employees`, {
      headers: userStore.getAuthHeaders(false) // ✅ GET
    });
    if (!res.ok) throw new Error('Kon werknemers niet ophalen');

    const data = await res.json();

    employees.value = data.map((emp) => {
      if (!emp.profile) emp.profile = { fullCommuteKm: 0, partialCommuteKm: 0 };

      const c = (emp.country || '').toUpperCase();
      if (c === 'NL') {
        if (!emp.bikeType) emp.bikeType = 'OWN';
        if (!['OWN', 'COMPANY'].includes(emp.bikeType)) emp.bikeType = 'OWN';
      }
      return emp;
    });
  } catch (e) {
    console.error(e);
    profileError.value = 'Fout bij ophalen werknemers.';
  }
}

async function saveProfile(emp) {
  profileMsg.value = '';
  profileError.value = '';

  try {
    const body = {
      fullCommuteKm: Number(emp.profile.fullCommuteKm ?? 0),
      partialCommuteKm: Number(emp.profile.partialCommuteKm ?? 0),
    };

    const c = (emp.country || '').toUpperCase();
    if (c === 'NL') body.bikeType = emp.bikeType;

    const res = await fetch(`${API}/employees/${emp.id}/profile`, {
      method: 'PUT',
      headers: userStore.getAuthHeaders(true),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      profileMsg.value = `Stamgegevens voor ${emp.name} opgeslagen!`;
      setTimeout(() => (profileMsg.value = ''), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      profileError.value = data.error || 'Opslaan mislukt.';
    }
  } catch (e) {
    console.error(e);
    profileError.value = 'Fout bij opslaan profiel.';
  }
}

// --- Add User ---
async function addUser() {
  addUserMsg.value = '';
  addUserError.value = '';
  try {
    const res = await fetch(`${API}/admin/users`, {
      method: 'POST',
      headers: userStore.getAuthHeaders(true),
      body: JSON.stringify(newUser.value)
    });
    if (!res.ok) {
      const data = await res.json();
      addUserError.value = data.error || 'Fout bij toevoegen';
      return;
    }
    addUserMsg.value = 'Gebruiker toegevoegd!';
    newUser.value = { name: '', country: 'BE', role: 'EMPLOYEE' };
    await fetchEmployees();
  } catch (e) {
    addUserError.value = e.message;
  }
}

// --- Settings ---
async function fetchSettings() {
  settingsMsg.value = '';
  settingsError.value = '';
  settings.value = null;

  try {
    const res = await fetch(`${API}/settings/${selectedCountry.value}`, {
      headers: userStore.getAuthHeaders(false)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Kon instellingen niet ophalen');
    }

    const s = data;

    settings.value = {
      ratePerKm: s.ratePerKm ?? 0,
      deadlineDayNextMonth: s.deadlineDayNextMonth ?? 12,
      capType: s.capType ?? 'NONE',
      monthlyCapAmount: s.monthlyCapAmount ?? null,
      yearlyCapAmount: s.yearlyCapAmount ?? null,
      beBlockAfterCap: !!s.beBlockAfterCap,
      exportDayOfMonth: s.exportDayOfMonth ?? 1,
      ...s,
    };
  } catch (e) {
    console.error(e);
    settingsError.value = e.message || 'Fout bij ophalen instellingen.';
  }
}

async function saveSettings() {
  settingsMsg.value = '';
  settingsError.value = '';

  try {
    const payload = {
      ratePerKm: Number(settings.value.ratePerKm ?? 0),
      deadlineDayNextMonth: Number(settings.value.deadlineDayNextMonth ?? 12),
      capType: settings.value.capType ?? 'NONE',

      monthlyCapAmount: ['MONTHLY', 'BOTH'].includes(settings.value.capType)
        ? Number(settings.value.monthlyCapAmount ?? 0)
        : null,

      yearlyCapAmount: ['YEARLY', 'BOTH'].includes(settings.value.capType)
        ? Number(settings.value.yearlyCapAmount ?? 0)
        : null,

      beBlockAfterCap: selectedCountry.value === 'BE'
        ? !!settings.value.beBlockAfterCap
        : false,

      exportDayOfMonth: Number(settings.value.exportDayOfMonth ?? 1),
    };

    const res = await fetch(`${API}/settings/${selectedCountry.value}`, {
      method: 'PUT',
      headers: userStore.getAuthHeaders(true), // ✅ PUT JSON
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      settingsMsg.value = 'Instellingen opgeslagen!';
      setTimeout(() => (settingsMsg.value = ''), 3000);
      await fetchSettings();
    } else {
      const data = await res.json().catch(() => ({}));
      settingsError.value = data.error || 'Kon instellingen niet opslaan.';
    }
  } catch (e) {
    console.error(e);
    settingsError.value = 'Netwerkfout bij opslaan.';
  }
}

// --- Export ---
async function triggerExport() {
  exportMsg.value = '';
  exportError.value = '';

  try {
    const res = await fetch(`${API}/exports/trigger?month=${exportMonth.value}`, {
      method: 'POST',
      headers: userStore.getAuthHeaders(false), // ✅ POST zonder body => geen JSON nodig
    });

    if (res.ok) {
      const data = await res.json();
      exportMsg.value = `Export job gestart! (Aantal records: ${data.count})`;
    } else {
      const data = await res.json().catch(() => ({}));
      exportError.value = data.error || 'Fout bij starten export.';
    }
  } catch (e) {
    console.error(e);
    exportError.value = 'Netwerkfout.';
  }
}

onMounted(async () => {
  await userStore.fetchMe();
  await fetchEmployees();
  await fetchSettings();
});
</script>
