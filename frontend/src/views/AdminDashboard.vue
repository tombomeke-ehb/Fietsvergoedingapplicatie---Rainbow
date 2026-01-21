<!-- frontend/src/views/AdminDashboard.vue -->
<template>
  <div class="page">
    <h1>Admin Dashboard</h1>

    <div class="card">
      <h2>Instellingen per land</h2>
      <label>
        Land:
        <select v-model="selectedCountry" @change="fetchSettings">
          <option value="BE">België</option>
          <option value="NL">Nederland</option>
        </select>
      </label>
      <form v-if="settings" @submit.prevent="saveSettings">
        <label>Bedrag per km: <input type="number" step="0.01" v-model.number="settings.ratePerKm" /></label>
        <label>Deadline dag volgende maand: <input type="number" v-model.number="settings.deadlineDayNextMonth" /></label>
        <label>Cap type:
          <select v-model="settings.capType">
            <option value="NONE">Geen</option>
            <option value="MONTHLY">Maandelijks</option>
            <option value="YEARLY">Jaarlijks</option>
            <option value="BOTH">Beide</option>
          </select>
        </label>
        <label v-if="settings.capType === 'MONTHLY' || settings.capType === 'BOTH'">
          Maandplafond (€): <input type="number" step="0.01" v-model.number="settings.monthlyCapAmount" />
        </label>
        <label v-if="settings.capType === 'YEARLY' || settings.capType === 'BOTH'">
          Jaarplafond (€): <input type="number" step="0.01" v-model.number="settings.yearlyCapAmount" />
        </label>
        <label v-if="selectedCountry === 'BE'">
          Blokkeren na plafond: <input type="checkbox" v-model="settings.beBlockAfterCap" />
        </label>
        <button type="submit">Opslaan</button>
      </form>
      <p v-if="settingsMsg" class="success">{{ settingsMsg }}</p>
      <p v-if="settingsError" class="error">{{ settingsError }}</p>
    </div>

    <div class="card">
      <h2>Export maandverwerking</h2>
      <label>Maand: <input type="month" v-model="exportMonth" /></label>
      <button @click="triggerExport">Exporteer</button>
      <p v-if="exportMsg" class="success">{{ exportMsg }}</p>
      <p v-if="exportError" class="error">{{ exportError }}</p>
    </div>

    <div class="card">
      <h2>Stamgegevens werknemers</h2>
      <table v-if="employees.length">
        <thead>
          <tr>
            <th>Naam</th>
            <th>Land</th>
            <th>Volledig (km)</th>
            <th>Gedeeltelijk (km)</th>
            <th v-if="showBikeType">Fiets (NL)</th>
            <th>Acties</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in employees" :key="emp.id">
            <td>{{ emp.name }}</td>
            <td>{{ emp.country }}</td>
            <td>
              <input type="number" step="0.1" v-model.number="emp.profile?.fullCommuteKm" />
            </td>
            <td>
              <input type="number" step="0.1" v-model.number="emp.profile?.partialCommuteKm" />
            </td>
            <td v-if="emp.country === 'NL'">
              <select v-model="emp.bikeType">
                <option value="OWN">Eigen fiets</option>
                <option value="COMPANY">Bedrijfsfiets</option>
              </select>
            </td>
            <td v-else-if="showBikeType"></td>
            <td>
              <button @click="saveProfile(emp)">Opslaan</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>Geen werknemers gevonden.</p>
      <p v-if="profileMsg" class="success">{{ profileMsg }}</p>
      <p v-if="profileError" class="error">{{ profileError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const API = 'http://localhost:3001';
const selectedCountry = ref('BE');
const settings = ref(null);
const settingsMsg = ref('');
const settingsError = ref('');
const exportMonth = ref(new Date().toISOString().slice(0, 7));
const exportMsg = ref('');
const exportError = ref('');
const employees = ref([]);
const profileMsg = ref('');
const profileError = ref('');
const showBikeType = true;

function getHeaders() {
  return { 'Content-Type': 'application/json', 'x-demo-user-id': localStorage.getItem('demoUserId') };
}

async function fetchSettings() {
  settingsMsg.value = '';
  settingsError.value = '';
  try {
    const res = await fetch(`${API}/settings/${selectedCountry.value}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Kon instellingen niet ophalen');
    settings.value = await res.json();
  } catch (e) {
    settingsError.value = e.message;
    settings.value = null;
  }
}

async function saveSettings() {
  settingsMsg.value = '';
  settingsError.value = '';
  try {
    const res = await fetch(`${API}/settings/${selectedCountry.value}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings.value)
    });
    if (!res.ok) throw new Error('Fout bij opslaan');
    settingsMsg.value = 'Instellingen opgeslagen!';
  } catch (e) {
    settingsError.value = e.message;
  }
}

async function triggerExport() {
  exportMsg.value = '';
  exportError.value = '';
  try {
    const res = await fetch(`${API}/exports/trigger?month=${exportMonth.value}`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Fout bij exporteren');
    exportMsg.value = 'Export uitgevoerd!';
  } catch (e) {
    exportError.value = e.message;
  }
}

async function fetchEmployees() {
  try {
    const res = await fetch(`${API}/employees`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Kon werknemers niet ophalen');
    employees.value = await res.json();
  } catch (e) {
    profileError.value = e.message;
    employees.value = [];
  }
}

async function saveProfile(emp) {
  profileMsg.value = '';
  profileError.value = '';
  try {
    const res = await fetch(`${API}/employees/${emp.id}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        fullCommuteKm: emp.profile?.fullCommuteKm,
        partialCommuteKm: emp.profile?.partialCommuteKm,
        bikeType: emp.bikeType
      })
    });
    if (!res.ok) throw new Error('Fout bij opslaan');
    profileMsg.value = 'Stamgegevens opgeslagen!';
    await fetchEmployees();
  } catch (e) {
    profileError.value = e.message;
  }
}

onMounted(() => {
  fetchSettings();
  fetchEmployees();
});
</script>

<style scoped>
.page {
  max-width: 700px;
  margin: 40px auto;
  padding: 24px;
  font-family: system-ui, sans-serif;
}
.card {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #444;
  border-radius: 14px;
}
label {
  display: block;
  margin-bottom: 10px;
}
input, select {
  margin-left: 8px;
  margin-bottom: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
th, td {
  border: 1px solid #444;
  padding: 6px 10px;
  text-align: left;
}
.success {
  margin-top: 14px;
  color: #4caf50;
}
.error {
  margin-top: 14px;
  color: #ff6b6b;
}
</style>
