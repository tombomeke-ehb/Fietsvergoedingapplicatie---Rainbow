<template>
  <div class="main-content">
    
    <header class="dashboard-header">
      <div class="welcome-section">
        <h1 class="greeting">👋 Hallo, {{ userStore.user?.name }}</h1>
        <p class="subtitle">Welkom op je persoonlijke mobiliteitsdashboard.</p>
      </div>
      <div v-if="hasProfile" class="profile-status badge badge-green">
        ✓ Profiel Actief
      </div>
    </header>
    
    <div v-if="!profileLoaded" class="loading-state">
      <div class="spinner"></div>
      <p>Profielgegevens ophalen...</p>
    </div>

    <div v-else-if="!hasProfile" class="alert-warning shadow-md">
      <div class="alert-icon">⚠️</div>
      <div class="alert-content">
        <h3>Profiel incompleet</h3>
        <p>Je werkgever heeft je traject (Verklaring op Eer) nog niet ingesteld. Registratie is tijdelijk geblokkeerd.</p>
      </div>
    </div>

    <div v-else class="dashboard-layout">
      
      <!-- Left Column: Actions & Info -->
      <div class="dashboard-sidebar">
        <!-- Stats Card -->
        <div class="card profile-card">
          <div class="card-header-clean">
            <h2>📍 Mijn Traject</h2>
          </div>
          <div class="stats-grid-vertical">
             <div class="stat-row">
               <div class="stat-icon">🏠</div>
               <div class="stat-details">
                 <small>Volledig Woon-Werk</small>
                 <strong>{{ userStore.user?.profile?.fullCommuteKm || 0 }} km</strong>
               </div>
             </div>
             <div class="stat-row">
               <div class="stat-icon">🚲</div>
               <div class="stat-details">
                 <small>Gedeeltelijk Traject</small>
                 <strong>{{ userStore.user?.profile?.partialCommuteKm || 0 }} km</strong>
               </div>
             </div>
             <div class="stat-row">
               <div class="stat-icon">💰</div>
               <div class="stat-details">
                 <small>Vergoeding Tarief</small>
                 <strong>{{ userStore.user?.country === 'BE' ? '€ 0.35/km' : '€ 0.23/km' }}</strong>
               </div>
             </div>
             <div v-if="userStore.user?.country === 'NL'" class="stat-row">
               <div class="stat-icon">🚴‍♂️</div>
               <div class="stat-details">
                 <small>Type Fiets</small>
                 <span :class="['badge', userStore.user?.bikeType === 'OWN' ? 'badge-green' : 'badge-yellow']">
                   {{ userStore.user?.bikeType === 'OWN' ? 'Eigen (Onbelast)' : 'Bedrijfs (Belast)' }}
                 </span>
               </div>
             </div>
          </div>
        </div>

        <!-- Action Card -->
        <div class="card action-card">
          <div class="card-header-clean">
            <h2>📝 Nieuwe Rit</h2>
          </div>
          <form @submit.prevent="submitTrip" class="trip-form-vertical">
            <div class="form-group">
              <label>Datum van rit</label>
              <input type="date" v-model="date" required class="large-input" />
            </div>
            
            <div class="form-group">
              <label>Type Verplaatsing</label>
              <div class="radio-group-vertical">
                <label :class="['radio-card', tripType === 'FULL' ? 'selected' : '']">
                  <input type="radio" v-model="tripType" value="FULL" />
                  <div class="radio-content">
                    <span class="radio-title">Volledig Woon-Werk</span>
                    <span class="radio-desc">{{ userStore.user?.profile?.fullCommuteKm || 0 }} km heen en terug</span>
                  </div>
                  <div class="radio-check" v-if="tripType === 'FULL'">✓</div>
                </label>
                
                <label :class="['radio-card', tripType === 'PARTIAL' ? 'selected' : '']">
                  <input type="radio" v-model="tripType" value="PARTIAL" />
                  <div class="radio-content">
                    <span class="radio-title">Gedeeltelijk Traject</span>
                    <span class="radio-desc">{{ userStore.user?.profile?.partialCommuteKm || 0 }} km (bijv. naar station)</span>
                  </div>
                  <div class="radio-check" v-if="tripType === 'PARTIAL'">✓</div>
                </label>
              </div>
            </div>

            <button type="submit" :disabled="submitting" class="btn-primary large-btn">
              {{ submitting ? 'Even geduld...' : '✅ Rit Registreren' }}
            </button>
          </form>
          
          <transition name="slide-fade">
             <div v-if="error" class="msg-box error-box">
               <span class="icon">🛑</span> {{ error }}
             </div>
          </transition>
          <transition name="slide-fade">
             <div v-if="success" class="msg-box success-box">
               <span class="icon">🎉</span> Rit succesvol opgeslagen!
             </div>
          </transition>
        </div>
      </div>

      <!-- Main Content: History -->
      <div class="dashboard-main">
        <div class="card history-card">
          <div class="list-header">
            <div class="header-left">
              <h2>📅 Mijn Ritten</h2>
              <span class="badge badge-gray">{{ trips.length }} ritten</span>
            </div>
            <div class="month-selector-wrapper">
              <input type="month" v-model="selectedMonth" @change="fetchTrips" class="month-input-styled" />
            </div>
          </div>
          
          <!-- Summary Header -->
          <div class="summary-header">
             <div class="summary-item">
               <span>Totaal Afstand</span>
               <span class="summary-value">{{ trips.reduce((s,t) => s + t.kmSnapshot, 0).toFixed(1) }} km</span>
             </div>
             <div class="summary-item highlight">
               <span>Totaal Vergoeding</span>
               <span class="summary-value">€ {{ totalAmount.toFixed(2) }}</span>
             </div>
          </div>

          <div class="table-wrapper stylish-table">
            <table v-if="trips.length">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Type</th>
                  <th class="text-right">Afstand</th>
                  <th class="text-right">Bedrag</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in trips" :key="t.id" class="trip-row">
                  <td>
                    <div class="date-cell">
                      <span class="day">{{ new Date(t.date).getDate() }}</span>
                      <span class="month">{{ new Date(t.date).toLocaleString('default', { month: 'short' }) }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="type-cell">
                      <span class="type-icon">{{ t.tripType === 'FULL' ? '🏠' : '🚂' }}</span>
                      <span>{{ t.tripType === 'FULL' ? 'Volledig' : 'Deels' }}</span>
                    </div>
                  </td>
                  <td class="text-right font-mono">{{ t.kmSnapshot }} km</td>
                  <td class="text-right font-mono font-bold text-primary">€ {{ t.amountSnapshot.toFixed(2) }}</td>
                  <td>
                    <span v-if="t.fiscalStatusSnapshot === 'TAX_FREE'" class="pill pill-success">Onbelast</span>
                    <span v-else class="pill pill-warning">Belast</span>
                  </td>
                  <td class="text-right">
                    <button @click="deleteTrip(t.id)" class="btn-icon delete-btn" title="Verwijderen">
                      ✕
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state-modern">
               <div class="empty-illustration">📅</div>
               <h3>Geen ritten gevonden</h3>
               <p>Selecteer een andere maand of registreer je eerste rit.</p>
            </div>
          </div>
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

// State
const date = ref(new Date().toISOString().slice(0, 10));
const tripType = ref('FULL');
const trips = ref([]);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const profileLoaded = ref(false);
const hasProfile = ref(false);
const submitting = ref(false);
const error = ref('');
const success = ref(false);

// Computed
const totalAmount = computed(() => trips.value.reduce((sum, t) => sum + t.amountSnapshot, 0));

// Methods
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function init() {
  await userStore.fetchMe();
  // Check of profile bestaat in user object
  if (userStore.user?.profile) {
    hasProfile.value = true;
  }
  profileLoaded.value = true;
  fetchTrips();
}

async function fetchTrips() {
  try {
    const res = await fetch(`${API}/trips?month=${selectedMonth.value}`, { headers: userStore.authHeaders });
    if (res.ok) {
      trips.value = await res.json();
    }
  } catch (e) {
    console.error("Fetch trips error", e);
  }
}

async function submitTrip() {
  submitting.value = true;
  error.value = '';
  success.value = false;
  
  try {
    const res = await fetch(`${API}/trips`, {
      method: 'POST',
      headers: userStore.authHeaders,
      body: JSON.stringify({ date: date.value, tripType: tripType.value })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      // Specifieke foutmeldingen vertalen naar NL
      if (data.error === 'CAP_REACHED_BE_BLOCK') error.value = "Limiet bereikt (BE Plafond). Registratie geblokkeerd.";
      else if (data.error === 'MAX_2_PER_DAY') error.value = "Maximaal 2 ritten per dag toegestaan.";
      else if (data.error === 'DEADLINE_PASSED') error.value = "Deadline voor deze maand is verstreken.";
      else error.value = data.error || "Er is een fout opgetreden.";
    } else {
      success.value = true;
      fetchTrips(); // Lijst verversen
      setTimeout(() => success.value = false, 4000);
    }
  } catch(e) {
    error.value = "Netwerkfout: Kan server niet bereiken.";
  } finally {
    submitting.value = false;
  }
}

async function deleteTrip(id) {
  if(!confirm("Weet je zeker dat je deze rit wilt verwijderen?")) return;
  
  try {
    const res = await fetch(`${API}/trips/${id}`, { method: 'DELETE', headers: userStore.authHeaders });
    
    if (res.ok) {
      fetchTrips();
    } else {
      const data = await res.json();
      alert(data.error === 'DEADLINE_PASSED' ? "Kan niet verwijderen: Deadline verstreken." : "Kon rit niet verwijderen.");
    }
  } catch (e) {
    alert("Netwerkfout bij verwijderen.");
  }
}

onMounted(init);
</script>

<style scoped>
/* Layout Grid */
.dashboard-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
}

/* Sidebar Styles */
.dashboard-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.card-header-clean {
  padding-bottom: 1rem;
  border-bottom: 1px solid #edf2f7;
  margin-bottom: 1rem;
}

.card-header-clean h2 {
  font-size: 1.2rem;
  margin: 0;
  color: var(--secondary);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f7fafc;
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-icon {
  width: 40px;
  height: 40px;
  background: #E6FFFA;
  color: var(--primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-details small {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.stat-details strong {
  font-size: 1rem;
  color: var(--text-primary);
}

/* Form Styles */
.trip-form-vertical {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.large-input {
  font-size: 1.1rem;
  padding: 0.8rem;
}

.radio-group-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.radio-card {
  display: flex;
  position: relative;
  align-items: center;
  padding: 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-card:hover {
  background: #F7FAFC;
  border-color: #CBD5E0;
}

.radio-card.selected {
  border-color: var(--primary);
  background: #F0FFF4;
}

.radio-card input {
  opacity: 0;
  position: absolute;
}

.radio-content {
  display: flex;
  flex-direction: column;
}

.radio-title {
  font-weight: 600;
  color: var(--text-primary);
}

.radio-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.radio-check {
  margin-left: auto;
  color: var(--primary);
  font-weight: bold;
}

.large-btn {
  padding: 1rem;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.msg-box {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.success-box {
  background: #F0FFF4;
  color: #276749;
  border: 1px solid #9AE6B4;
}

.error-box {
  background: #FFF5F5;
  color: #C53030;
  border: 1px solid #FEB2B2;
}

/* History & Table Styles */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.badge-gray {
  background: #EDF2F7;
  color: #4A5568;
  padding: 0.3rem 0.8rem;
  border-radius: 99px;
  font-size: 0.8rem;
}

.month-input-styled {
  padding: 0.5rem 1rem;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-family: inherit;
  color: var(--secondary);
}

.summary-header {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #F8FAFC;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-item span:first-child {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-weight: 600;
}

.summary-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-item.highlight .summary-value {
  color: var(--primary);
}

.stylish-table th {
  background: transparent;
  border-bottom: 2px solid #E2E8F0;
  padding: 1rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.trip-row td {
  padding: 1rem;
  vertical-align: middle;
}

.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #EDF2F7;
  width: 50px;
  padding: 0.3rem;
  border-radius: 8px;
  font-family: 'Roboto Mono', monospace;
}

.day { font-size: 1.1rem; font-weight: bold; }
.month { font-size: 0.7rem; text-transform: uppercase; }

.type-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pill {
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}
.pill-success { background: #E6FFFA; color: #38A169; }
.pill-warning { background: #FFFAF0; color: #DD6B20; }

.delete-btn {
  opacity: 0.4;
  transition: 0.2s;
  color: var(--error);
}

.trip-row:hover .delete-btn {
  opacity: 1;
  background: #FFF5F5;
}

.empty-state-modern {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-secondary);
}

.empty-illustration {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>