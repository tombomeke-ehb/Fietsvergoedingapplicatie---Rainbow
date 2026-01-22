<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>Admin Dashboard</h1>
        <p class="muted">Beheer werknemers, instellingen en exports.</p>
      </div>
    </header>

    <!-- SETTINGS CARD -->
    <section class="card">
      <div class="card-head">
        <div>
          <h2>Instellingen per land</h2>
          <p class="muted">Deze regels sturen berekening, plafonds en deadlines.</p>
        </div>

        <div class="row row-right">
          <label class="field">
            <span>Land</span>
            <select v-model="selectedCountry" @change="fetchSettings">
              <option value="BE">BE</option>
              <option value="NL">NL</option>
            </select>
          </label>
          <button class="btn" :disabled="!settings" @click="saveSettings">Opslaan</button>
        </div>
      </div>

      <div class="card-body">
        <div v-if="settingsError" class="alert alert-error">{{ settingsError }}</div>
        <div v-if="settingsMsg" class="alert alert-ok">{{ settingsMsg }}</div>

        <div v-if="!settings" class="muted">Instellingen laden…</div>

        <div v-else class="grid">
          <label class="field">
            <span>Bedrag per km</span>
            <input
              type="number"
              step="0.01"
              min="0"
              v-model.number="settings.ratePerKm"
            />
          </label>

          <label class="field">
            <span>Deadline (dag volgende maand)</span>
            <input
              type="number"
              min="1"
              max="31"
              v-model.number="settings.deadlineDayNextMonth"
            />
          </label>

          <label class="field">
            <span>Plafond type</span>
            <select v-model="settings.capType">
              <option value="MONTHLY">MONTHLY</option>
              <option value="YEARLY">YEARLY</option>
              <option value="NONE">NONE</option>
            </select>
          </label>

          <label class="field" v-if="settings.capType === 'MONTHLY'">
            <span>Maandplafond (€)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              v-model.number="settings.monthlyCapAmount"
            />
          </label>

          <label class="field" v-if="settings.capType === 'YEARLY'">
            <span>Jaarplafond (€)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              v-model.number="settings.yearlyCapAmount"
            />
          </label>

          <label class="field checkbox" v-if="selectedCountry === 'BE'">
            <span>Blokkeer registratie na plafond (BE)</span>
            <input type="checkbox" v-model="settings.beBlockAfterCap" />
          </label>

          <label class="field">
            <span>Export-dag van de maand</span>
            <input type="number" min="1" max="31" v-model.number="settings.exportDayOfMonth" />
          </label>
        </div>
      </div>
    </section>

    <!-- EMPLOYEES CARD -->
    <section class="card">
      <div class="card-head">
        <div>
          <h2>Werknemers</h2>
          <p class="muted">
            Beheer stamgegevens (verklaring op eer). Werknemers geven zelf geen km in.
            Bike type is enkel voor NL.
          </p>
        </div>

        <div class="row row-right">
          <button class="btn secondary" @click="fetchEmployees">Vernieuwen</button>
        </div>
      </div>

      <div class="card-body">
        <div v-if="profileError" class="alert alert-error">{{ profileError }}</div>
        <div v-if="profileMsg" class="alert alert-ok">{{ profileMsg }}</div>

        <div class="table-wrap" v-if="employees.length">
          <table class="table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Land</th>
                <th>Full commute (km)</th>
                <th>Partial commute (km)</th>
                <th>Bike type (enkel NL)</th>
                <th class="actions">Actie</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in employees" :key="emp.id">
                <td class="strong">{{ emp.name }}</td>
                <td>
                  <span class="pill">{{ emp.country || '-' }}</span>
                </td>

                <td>
                  <input
                    class="cell-input"
                    type="number"
                    step="0.1"
                    min="0"
                    v-model.number="emp.profile.fullCommuteKm"
                  />
                </td>

                <td>
                  <input
                    class="cell-input"
                    type="number"
                    step="0.1"
                    min="0"
                    v-model.number="emp.profile.partialCommuteKm"
                  />
                </td>

                <!-- Bike type: enkel NL, als dropdown -->
                <td>
                  <template v-if="(emp.country || '').toUpperCase() === 'NL'">
                    <select class="cell-input" v-model="emp.bikeType">
                      <option value="OWN">OWN (eigen fiets)</option>
                      <option value="COMPANY">COMPANY (bedrijfsfiets)</option>
                    </select>
                  </template>
                  <template v-else>
                    <span class="muted">—</span>
                  </template>
                </td>

                <td class="actions">
                  <button class="btn" @click="saveProfile(emp)">Opslaan</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="muted">
          Geen werknemers gevonden (of nog aan het laden)…
        </div>
      </div>
    </section>

    <!-- EXPORT CARD -->
    <section class="card">
      <div class="card-head">
        <div>
          <h2>Export</h2>
          <p class="muted">Start een export-job op de backend voor de gekozen maand.</p>
        </div>
      </div>

      <div class="card-body">
        <div v-if="exportError" class="alert alert-error">{{ exportError }}</div>
        <div v-if="exportMsg" class="alert alert-ok">{{ exportMsg }}</div>

        <div class="row">
          <label class="field">
            <span>Maand (YYYY-MM)</span>
            <input type="month" v-model="exportMonth" />
          </label>
          <button class="btn" @click="triggerExport">Start export</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../store';

const API = 'http://localhost:3001';
const userStore = useUserStore();

const employees = ref([]);
const profileMsg = ref('');
const profileError = ref('');

const selectedCountry = ref('BE');
const settings = ref(null);
const settingsMsg = ref('');
const settingsError = ref('');

const exportMonth = ref(new Date().toISOString().slice(0, 7));
const exportMsg = ref('');
const exportError = ref('');

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
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 18px 60px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 18px;
}

h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
}

h2 {
  margin: 0;
  font-size: 20px;
}

.muted {
  color: #6b7280;
  margin: 6px 0 0;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
  margin-top: 16px;
  overflow: hidden;
}

.card-head {
  padding: 16px 16px 12px;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #f0f2f5;
}

.card-body {
  padding: 16px;
}

.row {
  display: flex;
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
}

.row-right {
  justify-content: end;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.field {
  display: grid;
  gap: 6px;
  min-width: 180px;
}

.field > span {
  font-size: 12px;
  color: #374151;
}

.field input,
.field select {
  height: 38px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  background: #fff;
}

.field input:focus,
.field select:focus {
  border-color: #9ca3af;
}

.checkbox {
  align-items: center;
}
.checkbox input {
  height: 18px;
  width: 18px;
  justify-self: start;
}

.btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #111827;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.btn.secondary {
  background: #fff;
  color: #111827;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid transparent;
}

.alert-ok {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}

.alert-error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #eef0f3;
  border-radius: 12px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;
}

.table th,
.table td {
  padding: 12px;
  border-bottom: 1px solid #eef0f3;
  text-align: left;
  vertical-align: middle;
}

.table th {
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
  background: #fafafa;
}

.strong {
  font-weight: 700;
}

.pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  font-weight: 700;
  font-size: 12px;
}

.cell-input {
  width: 100%;
  min-width: 160px;
}

.actions {
  width: 130px;
}
</style>
