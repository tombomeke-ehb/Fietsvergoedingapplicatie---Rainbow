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
    const res = await fetch(`${API}/employees`, { headers: userStore.authHeaders });
    if (!res.ok) throw new Error('Kon werknemers niet ophalen');

    const data = await res.json();

    employees.value = data.map((emp) => {
      if (!emp.profile) emp.profile = { fullCommuteKm: 0, partialCommuteKm: 0 };

      // Zorg dat bikeType voor NL altijd een geldige enum is (OWN/COMPANY)
      const c = (emp.country || '').toUpperCase();
      if (c === 'NL') {
        if (!emp.bikeType) emp.bikeType = 'OWN';
        if (!['OWN', 'COMPANY'].includes(emp.bikeType)) emp.bikeType = 'OWN';
      } else {
        // Voor BE mag bikeType eigenlijk irrelevant zijn
        // (we laten het staan als backend het meegeeft, maar UI toont het niet)
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

    // Enkel NL mag bikeType krijgen volgens je functionele analyse
    const c = (emp.country || '').toUpperCase();
    if (c === 'NL') body.bikeType = emp.bikeType;

    const res = await fetch(`${API}/employees/${emp.id}/profile`, {
      method: 'PUT',
      headers: {
        ...userStore.authHeaders,
        'Content-Type': 'application/json',
      },
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

// --- Settings ---
async function fetchSettings() {
  settingsMsg.value = '';
  settingsError.value = '';
  settings.value = null;

  try {
    const res = await fetch(`${API}/settings/${selectedCountry.value}`, { headers: userStore.authHeaders });
    if (!res.ok) throw new Error('Kon instellingen niet ophalen');

    const s = await res.json();

    // Kleine safety defaults zodat UI niet breekt
    settings.value = {
      ratePerKm: s.ratePerKm ?? 0,
      deadlineDayNextMonth: s.deadlineDayNextMonth ?? 12,
      capType: s.capType ?? 'NONE',
      monthlyCapAmount: s.monthlyCapAmount ?? null,
      yearlyCapAmount: s.yearlyCapAmount ?? null,
      beBlockAfterCap: !!s.beBlockAfterCap,
      exportDayOfMonth: s.exportDayOfMonth ?? 1,
      // laat extra velden (id, createdAt, updatedAt) gerust bestaan op backend,
      // maar we tonen ze niet in UI.
      ...s,
    };
  } catch (e) {
    console.error(e);
    settingsError.value = 'Fout bij ophalen instellingen.';
  }
}

async function saveSettings() {
  settingsMsg.value = '';
  settingsError.value = '';

  try {
    // Verstuur enkel de relevante velden
    const payload = {
      ratePerKm: Number(settings.value.ratePerKm ?? 0),
      deadlineDayNextMonth: Number(settings.value.deadlineDayNextMonth ?? 12),
      capType: settings.value.capType ?? 'NONE',
      monthlyCapAmount: settings.value.capType === 'MONTHLY'
        ? Number(settings.value.monthlyCapAmount ?? 0)
        : null,
      yearlyCapAmount: settings.value.capType === 'YEARLY'
        ? Number(settings.value.yearlyCapAmount ?? 0)
        : null,
      beBlockAfterCap: selectedCountry.value === 'BE' ? !!settings.value.beBlockAfterCap : false,
      exportDayOfMonth: Number(settings.value.exportDayOfMonth ?? 1),
    };

    const res = await fetch(`${API}/settings/${selectedCountry.value}`, {
      method: 'PUT',
      headers: {
        ...userStore.authHeaders,
        'Content-Type': 'application/json',
      },
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
      headers: userStore.authHeaders,
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

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0px;
}

.form-group.half {
  flex: 1;
  min-width: 0;
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
