<template>
  <div>
    <h1>Admin Dashboard</h1>
    
    <div class="card">
      <div class="card-header">
        <h2>👥 Beheer Verklaring op Eer (Stamgegevens)</h2>
        <button @click="fetchEmployees" class="btn-secondary btn-sm">🔄 Verversen</button>
      </div>
      
      <p style="font-size: 0.9em; color: #666;">
        Hier stel je de afstanden in voor de werknemers. Zonder deze gegevens zien zij "Profiel incompleet".
      </p>

      <div class="table-wrapper">
        <table v-if="employees.length">
          <thead>
            <tr>
              <th>Werknemer</th>
              <th>Land</th>
              <th>Volledig (km)</th>
              <th>Deels (km)</th>
              <th>Type Fiets (NL)</th>
              <th>Actie</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id">
              <td>
                <strong>{{ emp.name }}</strong><br>
                <small>{{ emp.email || 'Geen email' }}</small>
              </td>
              <td>
                <span class="badge" style="background: #e2e8f0; color: #475569;">{{ emp.country }}</span>
              </td>
              
              <td>
                <input type="number" step="0.1" v-model.number="emp.profile.fullCommuteKm" class="input-sm" />
              </td>
              <td>
                <input type="number" step="0.1" v-model.number="emp.profile.partialCommuteKm" class="input-sm" />
              </td>

              <td>
                <select v-if="emp.country === 'NL'" v-model="emp.bikeType" class="input-sm">
                  <option value="OWN">Eigen (Onbelast)</option>
                  <option value="COMPANY">Bedrijfs (Belast)</option>
                </select>
                <span v-else class="text-muted">-</span>
              </td>

              <td>
                <button @click="saveProfile(emp)" class="btn-primary btn-sm">💾 Opslaan</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else>Geen werknemers gevonden.</p>
      </div>
      <p v-if="profileMsg" class="msg-success">{{ profileMsg }}</p>
      <p v-if="profileError" class="msg-error">{{ profileError }}</p>
    </div>

    <div class="card">
      <h2>⚙️ Instellingen per Land</h2>
      <div class="form-group">
        <label>Selecteer Land</label>
        <select v-model="selectedCountry" @change="fetchSettings">
          <option value="BE">België</option>
          <option value="NL">Nederland</option>
        </select>
      </div>

      <form v-if="settings" @submit.prevent="saveSettings" class="settings-grid">
        <div class="form-group">
          <label>Vergoeding per km (€)</label>
          <input type="number" step="0.01" v-model.number="settings.ratePerKm" />
        </div>
        <div class="form-group">
          <label>Deadline (dag v/d maand)</label>
          <input type="number" v-model.number="settings.deadlineDayNextMonth" />
        </div>
        
        <div class="form-group">
          <label>Type Limiet (Cap)</label>
          <select v-model="settings.capType">
            <option value="NONE">Geen</option>
            <option value="MONTHLY">Maandelijks</option>
            <option value="YEARLY">Jaarlijks</option>
            <option value="BOTH">Beide</option>
          </select>
        </div>

        <div v-if="['MONTHLY', 'BOTH'].includes(settings.capType)" class="form-group">
          <label>Maandplafond (€)</label>
          <input type="number" step="0.01" v-model.number="settings.monthlyCapAmount" />
        </div>
        
        <div v-if="['YEARLY', 'BOTH'].includes(settings.capType)" class="form-group">
          <label>Jaarplafond (€)</label>
          <input type="number" step="0.01" v-model.number="settings.yearlyCapAmount" />
        </div>

        <div v-if="selectedCountry === 'BE'" class="form-group checkbox-group">
          <input type="checkbox" v-model="settings.beBlockAfterCap" id="blockCap" />
          <label for="blockCap">Blokkeren na bereiken plafond?</label>
        </div>

        <div class="full-width">
          <button type="submit" class="btn-primary">Instellingen Opslaan</button>
        </div>
      </form>
      <p v-if="settingsMsg" class="msg-success">{{ settingsMsg }}</p>
    </div>

    <div class="card">
      <h2>🚀 Maandverwerking</h2>
      <p>Start de berekening voor payroll.</p>
      <div style="display: flex; gap: 1rem; align-items: flex-end;">
        <div class="form-group">
          <label>Maand</label>
          <input type="month" v-model="exportMonth" />
        </div>
        <button @click="triggerExport" class="btn-primary" style="margin-bottom: 0.2rem;">Start Export Job</button>
      </div>
      <p v-if="exportMsg" class="msg-success">{{ exportMsg }}</p>
      <p v-if="exportError" class="msg-error">{{ exportError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../store';

const API = 'http://localhost:3001';
const userStore = useUserStore();

// --- STATE ---
const employees = ref([]);
const profileMsg = ref('');
const profileError = ref('');

const selectedCountry = ref('BE');
const settings = ref(null);
const settingsMsg = ref('');

const exportMonth = ref(new Date().toISOString().slice(0, 7));
const exportMsg = ref('');
const exportError = ref('');

// --- METHODS: Employees (Stamgegevens) ---
async function fetchEmployees() {
  try {
    const res = await fetch(`${API}/employees`, { headers: userStore.authHeaders });
    if (!res.ok) throw new Error("Kon werknemers niet ophalen");
    
    const data = await res.json();
    
    // Zorg dat elke employee een profile object heeft, ook al is het leeg in DB
    employees.value = data.map(emp => {
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
  profileMsg.value = '';
  profileError.value = '';
  try {
    const body = {
      fullCommuteKm: emp.profile.fullCommuteKm,
      partialCommuteKm: emp.profile.partialCommuteKm,
      bikeType: emp.bikeType // Enkel relevant voor NL
    };

    const res = await fetch(`${API}/employees/${emp.id}/profile`, {
      method: 'PUT',
      headers: userStore.authHeaders,
      body: JSON.stringify(body)
    });

    if (res.ok) {
      profileMsg.value = `Stamgegevens voor ${emp.name} opgeslagen!`;
      // Even wachten en dan bericht weg
      setTimeout(() => profileMsg.value = '', 3000);
    } else {
      throw new Error('Opslaan mislukt');
    }
  } catch (e) {
    profileError.value = "Fout bij opslaan profiel.";
  }
}

// --- METHODS: Settings ---
async function fetchSettings() {
  const res = await fetch(`${API}/settings/${selectedCountry.value}`, { headers: userStore.authHeaders });
  if (res.ok) settings.value = await res.json();
}

async function saveSettings() {
  const res = await fetch(`${API}/settings/${selectedCountry.value}`, {
    method: 'PUT',
    headers: userStore.authHeaders,
    body: JSON.stringify(settings.value)
  });
  if (res.ok) {
    settingsMsg.value = 'Instellingen opgeslagen!';
    setTimeout(() => settingsMsg.value = '', 3000);
  }
}

// --- METHODS: Export ---
async function triggerExport() {
  exportMsg.value = '';
  exportError.value = '';
  try {
    const res = await fetch(`${API}/exports/trigger?month=${exportMonth.value}`, {
      method: 'POST',
      headers: userStore.authHeaders
    });
    if (res.ok) {
      const data = await res.json();
      exportMsg.value = `Export job gestart! (Aantal records: ${data.count})`;
    } else {
      exportError.value = "Fout bij starten export.";
    }
  } catch(e) {
    exportError.value = "Netwerkfout.";
  }
}

// --- INIT ---
onMounted(async () => {
  await userStore.fetchMe();
  fetchEmployees();
  fetchSettings();
});
</script>

<style scoped>
/* Specifieke styles voor dit dashboard om het netjes te maken */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
}

.input-sm {
  width: 80px;
  padding: 4px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.85rem;
}

.btn-secondary {
  background: #64748b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.text-muted { color: #94a3b8; }

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-group {
  grid-column: span 2;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.full-width {
  grid-column: span 2;
  margin-top: 1rem;
}
</style>