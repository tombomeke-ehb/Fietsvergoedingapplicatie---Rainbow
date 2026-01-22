<template>
  <div class="main-content">
    <header class="dashboard-header">
      <div class="header-title">
        <h1>📊 Payroll Dashboard</h1>
        <p class="subtitle">Maandoverzicht van de fietsvergoedingen voor export.</p>
      </div>
      
      <div class="month-filter">
        <label>Periode</label>
        <select v-model="selectedMonth" @change="fetchExports" class="filter-input">
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>
      </div>
    </header>
    
    <div v-if="exports.length > 0" class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon icon-users">👥</div>
        <div class="kpi-content">
          <small>Werknemers</small>
          <strong>{{ exports.length }}</strong>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon icon-distance">📏</div>
        <div class="kpi-content">
          <small>Totale Afstand</small>
          <strong>{{ totalKm.toFixed(1) }} km</strong>
        </div>
      </div>
      <div class="kpi-card highlight">
        <div class="kpi-icon icon-money">💰</div>
        <div class="kpi-content">
          <small>Totaal Uit te keren</small>
          <strong>€ {{ totalAmount.toFixed(2) }}</strong>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon icon-avg">📉</div>
        <div class="kpi-content">
          <small>Gemiddeld / persoon</small>
          <strong>€ {{ (totalAmount / exports.length).toFixed(2) }}</strong>
        </div>
      </div>
    </div>

    <!-- Details Table -->
    <div class="card table-card">
      <div class="card-header no-border">
        <h2>📑 Detailoverzicht</h2>
        <div class="actions">
          <button @click="downloadAllCsv" v-if="exports.length" class="btn-secondary btn-sm" title="Nog niet geïmplementeerd">
            📥 Alles downloaden
          </button>
        </div>
      </div>

      <div class="table-wrapper stylish-table">
        <table v-if="exports.length">
          <thead>
            <tr>
              <th>Werknemer</th>
              <th class="text-right">Afstand</th>
              <th class="text-right">Totaal €</th>
              <th class="text-right">Onbelast</th>
              <th class="text-right">Belast</th>
              <th class="text-center">Status</th>
              <th class="text-right">Actie</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exp in exports" :key="exp.id" class="export-row">
              <td>
                <div class="user-info">
                  <div class="avatar-small">{{ exp.user.name.charAt(0) }}</div>
                  <strong>{{ exp.user.name }}</strong>
                </div>
              </td>
              <td class="text-right font-mono">{{ exp.totalKm.toFixed(1) }} km</td>
              <td class="text-right font-mono font-bold text-primary">€ {{ exp.totalAmount.toFixed(2) }}</td>
              <td class="text-right font-mono text-success">€ {{ (exp.totalTaxFreeAmount||0).toFixed(2) }}</td>
              <td class="text-right font-mono text-warning">€ {{ (exp.totalTaxedAmount||0).toFixed(2) }}</td>
              <td class="text-center">
                <span :class="['status-badge', getStatusClass(exp.status)]">
                  {{ getStatusText(exp.status) }}
                </span>
              </td>
              <td class="text-right">
                <button @click="downloadCsv(exp.id)" class="btn-icon download-btn" title="Download CSV">
                  ⬇
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>Totaal Generaal</td>
              <td class="text-right">{{ totalKm.toFixed(1) }} km</td>
              <td class="text-right">€ {{ totalAmount.toFixed(2) }}</td>
              <td class="text-right">€ {{ totalTaxFree.toFixed(2) }}</td>
              <td class="text-right">€ {{ totalTaxed.toFixed(2) }}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
        <div v-else class="empty-state-modern">
          <div class="empty-illustration">📭</div>
          <h3>Geen data gevonden</h3>
          <p>Er zijn (nog) geen exports gegenereerd voor deze maand.</p>
          <p class="hint">Vraag de beheerder om de maandverwerking te starten in het Admin Dashboard.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../store';

const API = 'http://localhost:3001';
const userStore = useUserStore();
const selectedMonth = ref('');
const monthOptions = ref([]);
const exports = ref([]);

async function fetchAvailableExportMonths() {
  try {
    const res = await fetch(`${API}/exports/months`, {
      headers: userStore.getAuthHeaders(false)
    });
    if (!res.ok) return;
    const months = await res.json();
    monthOptions.value = months.map((value) => {
      const [y, m] = value.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      const label = d.toLocaleString('nl-BE', { month: 'long', year: 'numeric' });
      return { value, label };
    });
    if (monthOptions.value.length) {
      selectedMonth.value = monthOptions.value[0].value;
    }
  } catch (e) {
    // fallback: geen maanden
    monthOptions.value = [];
  }
}

const totalKm = computed(() => exports.value.reduce((sum, exp) => sum + exp.totalKm, 0));
const totalAmount = computed(() => exports.value.reduce((sum, exp) => sum + exp.totalAmount, 0));
const totalTaxFree = computed(() => exports.value.reduce((sum, exp) => sum + (exp.totalTaxFreeAmount || 0), 0));
const totalTaxed = computed(() => exports.value.reduce((sum, exp) => sum + (exp.totalTaxedAmount || 0), 0));

function getStatusClass(status) {
  const classes = {
    'READY': 'status-ready',
    'PENDING': 'status-pending',
    'PROCESSED': 'status-processed',
    'EXPORTED': 'status-exported'
  };
  return classes[status] || 'status-default';
}

function getStatusText(status) {
  const texts = {
    'READY': 'Klaar',
    'PENDING': 'In wacht',
    'PROCESSED': 'Verwerkt',
    'EXPORTED': 'Geëxporteerd'
  };
  return texts[status] || status;
}

async function fetchExports() {
  if (!selectedMonth.value) return;
  try {
    const res = await fetch(`${API}/exports?month=${selectedMonth.value}`, {
      headers: userStore.getAuthHeaders(false)
    });

    if (res.ok) {
      exports.value = await res.json();
    } else {
      const data = await res.json().catch(() => ({}));
      console.warn('exports fetch failed:', data);
    }
  } catch (e) {
    console.error('Error fetching exports:', e);
  }
}

async function downloadCsv(id) {
  const res = await fetch(`${API}/exports/${id}/download`, {
    headers: userStore.getAuthHeaders(false)
  });

  if (res.ok) {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${id}.csv`;
    a.click();

    window.URL.revokeObjectURL(url);
  } else {
    alert("Download mislukt");
  }
}

async function downloadAllCsv() {
  if (!selectedMonth.value) return;
  const res = await fetch(`${API}/exports/download-all?month=${selectedMonth.value}`, {
    headers: userStore.getAuthHeaders(false)
  });
  if (res.ok) {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${selectedMonth.value}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    alert("Download mislukt");
  }
}

onMounted(async () => {
  await userStore.fetchMe();
  await fetchAvailableExportMonths();
  await fetchExports();
});
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0;
}

.month-filter label {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 600;
}

.filter-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.calendar-icon {
  position: absolute;
  left: 10px;
  pointer-events: none;
}

.filter-input {
  padding-left: 2.2rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  height: 40px;
  font-family: inherit;
  color: var(--secondary);
  font-weight: 500;
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  padding: 1.2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid transparent;
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

.kpi-card.highlight {
  background: linear-gradient(135deg, #2F855A 0%, #276749 100%);
  color: white;
}

.kpi-card.highlight .kpi-content small {
  color: rgba(255,255,255,0.8);
}

.kpi-card.highlight .kpi-content strong {
  color: white;
}

.kpi-card.highlight .kpi-icon {
  background: rgba(255,255,255,0.2);
  color: white;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: #F7FAFC;
}

.icon-users { background: #EBF8FF; color: #3182CE; }
.icon-distance { background: #E6FFFA; color: #38A169; }
.icon-avg { background: #FFF5F5; color: #E53E3E; }

.kpi-content {
  display: flex;
  flex-direction: column;
}

.kpi-content small {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-weight: 600;
}

.kpi-content strong {
  font-size: 1.25rem;
  color: var(--text-primary);
  font-weight: 700;
}

/* Table Styles */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.avatar-small {
  width: 32px;
  height: 32px;
  background: var(--secondary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-ready { background: #EBF8FF; color: #2B6CB0; }
.status-pending { background: #FEFCBF; color: #975A16; }
.status-processed { background: #C6F6D5; color: #22543D; }
.status-exported { background: #E9D8FD; color: #553C9A; }

.download-btn {
  background: #EDF2F7;
  border-radius: 6px;
  color: var(--text-secondary);
}

.download-btn:hover {
  background: var(--primary);
  color: white;
}

.total-row {
  background: #F7FAFC;
  font-weight: 700;
  border-top: 2px solid #E2E8F0;
}

.total-row td {
  padding-top: 1rem;
  padding-bottom: 1rem;
  color: var(--secondary);
}

.empty-state-modern {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-secondary);
}

.empty-illustration {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hint {
  font-size: 0.85rem;
  background: #FFF5F5;
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  color: #C53030;
}
</style>