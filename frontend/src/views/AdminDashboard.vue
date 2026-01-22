<template>
  <div class="main-content">
    <div class="header-section">
      <h1>⚙️ Admin Dashboard</h1>
      <p class="subtitle">Beheer werknemers, instellingen en exporteer maandelijkse rapporten.</p>
    </div>

    <!-- Quick Actions / Stats Placeholder could go here -->

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
          <div class="form-group">
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
          
          <div class="form-group">
            <label>Deadline (dag v/d maand)</label>
            <div class="input-group">
              <span class="prefix">📅</span>
              <input type="number" v-model.number="settings.deadlineDayNextMonth" />
            </div>
          </div>

          <div class="form-group">
            <label>Type Limiet (Cap)</label>
            <select v-model="settings.capType">
              <option value="NONE">🔓 Geen Limiet</option>
              <option value="MONTHLY">📅 Maandelijks</option>
              <option value="YEARLY">📆 Jaarlijks</option>
              <option value="BOTH">🔒 Beide</option>
            </select>
          </div>

          <div
            v-if="['MONTHLY', 'BOTH'].includes(settings.capType)"
            class="form-group"
          >
            <label>Maandplafond</label>
            <div class="input-group">
              <span class="prefix">€</span>
              <input
                type="number"
                step="0.01"
                v-model.number="settings.monthlyCapAmount"
              />
            </div>
          </div>

          <div
            v-if="['YEARLY', 'BOTH'].includes(settings.capType)"
            class="form-group"
          >
             <label>Jaarplafond</label>
             <div class="input-group">
              <span class="prefix">€</span>
              <input
                type="number"
                step="0.01"
                v-model.number="settings.yearlyCapAmount"
              />
            </div>
          </div>

          <div v-if="selectedCountry === 'BE'" class="form-group checkbox-wrapper">
            <label class="switch">
              <input
                type="checkbox"
                v-model="settings.beBlockAfterCap"
              />
              <span class="slider round"></span>
            </label>
            <span class="switch-label">Blokkeren na bereiken plafond</span>
          </div>

          <button type="submit" class="btn-primary full-width-btn">
            💾 Instellingen Opslaan
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

// --- STATE ---
const employees = ref([]);
const profileMsg = ref("");
const profileError = ref("");

const selectedCountry = ref("BE");
const settings = ref(null);
const settingsMsg = ref("");

const exportMonth = ref(new Date().toISOString().slice(0, 7));
const exportMsg = ref("");
const exportError = ref("");

// --- METHODS: Employees (Stamgegevens) ---
async function fetchEmployees() {
  try {
    const res = await fetch(`${API}/employees`, {
      headers: userStore.authHeaders,
    });
    if (!res.ok) throw new Error("Kon werknemers niet ophalen");

    const data = await res.json();

    // Zorg dat elke employee een profile object heeft, ook al is het leeg in DB
    employees.value = data.map((emp) => {
      if (!emp.profile) {
        emp.profile = { fullCommuteKm: 0, partialCommuteKm: 0 };
      }
      return emp;
    });
  } catch (e) {
    console.error(e);
  }
}

async function saveProfile(emp) {
  profileMsg.value = "";
  profileError.value = "";
  try {
    const body = {
      fullCommuteKm: emp.profile.fullCommuteKm,
      partialCommuteKm: emp.profile.partialCommuteKm,
      bikeType: emp.bikeType, // Enkel relevant voor NL
    };

    const res = await fetch(`${API}/employees/${emp.id}/profile`, {
      method: "PUT",
      headers: userStore.authHeaders,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      profileMsg.value = `Stamgegevens voor ${emp.name} opgeslagen!`;
      // Even wachten en dan bericht weg
      setTimeout(() => (profileMsg.value = ""), 3000);
    } else {
      throw new Error("Opslaan mislukt");
    }
  } catch (e) {
    profileError.value = "Fout bij opslaan profiel.";
  }
}

// --- METHODS: Settings ---
async function fetchSettings() {
  const res = await fetch(`${API}/settings/${selectedCountry.value}`, {
    headers: userStore.authHeaders,
  });
  if (res.ok) settings.value = await res.json();
}

async function saveSettings() {
  const res = await fetch(`${API}/settings/${selectedCountry.value}`, {
    method: "PUT",
    headers: userStore.authHeaders,
    body: JSON.stringify(settings.value),
  });
  if (res.ok) {
    settingsMsg.value = "Instellingen opgeslagen!";
    setTimeout(() => (settingsMsg.value = ""), 3000);
  }
}

// --- METHODS: Export ---
async function triggerExport() {
  exportMsg.value = "";
  exportError.value = "";
  try {
    const res = await fetch(
      `${API}/exports/trigger?month=${exportMonth.value}`,
      {
        method: "POST",
        headers: userStore.authHeaders,
      },
    );
    if (res.ok) {
      const data = await res.json();
      exportMsg.value = `Export job gestart! (Aantal records: ${data.count})`;
    } else {
      exportError.value = "Fout bij starten export.";
    }
  } catch (e) {
    exportError.value = "Netwerkfout.";
  }
}

onMounted(async () => {
  await userStore.fetchMe();
  fetchEmployees();
  fetchSettings();
});
</script>

<style scoped>
/* Modern Dashboard Styles */
.header-section {
  margin-bottom: 2rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* User Avatar Cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.user-name {
  display: block;
  font-size: 1rem;
  color: var(--text-primary);
}

.user-email {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Badges & Flags */
.country-badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
}

.be-flag { background: #EBF8FF; color: #2C5282; border: 1px solid #BEE3F8; }
.nl-flag { background: #FFF5F5; color: #C53030; border: 1px solid #FED7D7; }

/* Inputs with Units */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-sm {
  width: 100px;
  padding-right: 2.5rem;
  text-align: right;
  font-family: 'Roboto Mono', monospace;
}

.unit {
  position: absolute;
  right: 10px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  pointer-events: none;
}

.bike-select {
  width: 100%;
  min-width: 160px;
}

/* Settings Card Styling */
.settings-card {
  background: white;
  height: fit-content;
}

.settings-form {
  display: grid;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface);
  transition: all 0.2s;
}

.input-group:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(47, 133, 90, 0.1);
}

.prefix {
  padding: 0 1rem;
  color: var(--text-secondary);
  background: var(--background);
  border-right: 1px solid var(--border-color);
  height: 100%;
  display: flex;
  align-items: center;
}

.input-group input {
  border: none;
  width: 100%;
  padding: 0.75rem;
}

.input-group input:focus {
  box-shadow: none;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary);
}

input:checked + .slider:before {
  transform: translateX(23px);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--background);
  border-radius: 8px;
}

.switch-label {
  font-weight: 500;
  color: var(--text-primary);
}

.full-width-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  font-size: 1rem;
}

/* Export Card */
.export-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.export-box {
  background: var(--background);
  padding: 1.5rem;
  border-radius: 12px;
  margin: 1.5rem 0;
  border: 1px dashed var(--border-color);
}

.export-btn {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  font-size: 1.1rem;
  margin-top: 1rem;
}

.info-box {
  background: #EBF8FF;
  padding: 1rem;
  border-radius: 6px;
  color: #2C5282;
  font-size: 0.9rem;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
