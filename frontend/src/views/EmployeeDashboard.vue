<template>
  <div>
    <h1>👋 Welkom, {{ userStore.user?.name }}</h1>

    <div v-if="!profileLoaded">Profiel laden...</div>

    <div v-else-if="!hasProfile" class="alert-warning">
      <h3>⚠️ Profiel incompleet</h3>
      <p>Je werkgever heeft je traject (Verklaring op Eer) nog niet ingesteld. Registratie is tijdelijk geblokkeerd.</p>
    </div>

    <div v-else>
      <div class="card" style="background: #f8fafc; border-left: 4px solid #3b82f6;">
        <h2>Mijn Trajectgegevens</h2>

        <div class="stats-grid">
          <div class="stat-item">
            <small>Volledig traject</small>
            <strong>{{ userStore.user?.profile?.fullCommuteKm || 0 }} km</strong>
          </div>

          <div class="stat-item">
            <small>Gedeeltelijk traject</small>
            <strong>{{ userStore.user?.profile?.partialCommuteKm || 0 }} km</strong>
          </div>

          <div class="stat-item">
            <small>Vergoeding per km</small>
            <!-- rate komt uit settings van het land van de user -->
            <strong v-if="countrySettings">€ {{ countrySettings.ratePerKm.toFixed(2) }}/km</strong>
            <strong v-else>-</strong>
          </div>

          <div v-if="userStore.user?.country === 'NL'" class="stat-item">
            <small>Type Fiets</small>
            <strong>{{ userStore.user?.bikeType === 'OWN' ? 'Eigen (Onbelast)' : 'Bedrijfs (Belast)' }}</strong>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>🗓️ Nieuwe Rit Registreren</h2>

        <form @submit.prevent="submitTrip" class="trip-form">
          <div class="form-group">
            <label>Datum</label>
            <input type="date" v-model="date" required />
          </div>

          <div class="form-group">
            <label>Type Traject</label>
            <select v-model="tripType">
              <option value="FULL">Volledig Woon-Werk</option>
              <option value="PARTIAL">Gedeeltelijk Traject</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="submitting" class="btn-primary">
              {{ submitting ? 'Bezig...' : 'Registreren' }}
            </button>
          </div>
        </form>

        <p v-if="error" class="msg-error">{{ error }}</p>
        <p v-if="success" class="msg-success">Rit succesvol opgeslagen!</p>
      </div>

      <div class="card">
        <div class="list-header">
          <h2>Mijn Ritten</h2>

          <div class="month-selector">
            <label>Maand:</label>
            <input type="month" v-model="selectedMonth" @change="fetchTrips" />
          </div>
        </div>

        <div class="table-wrapper">
          <table v-if="trips.length">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Type</th>
                <th>Afstand</th>
                <th>Vergoeding</th>
                <th>Status</th>
                <th>Actie</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="t in trips" :key="t.id">
                <td>{{ t.date }}</td>
                <td>
                  <span :class="t.tripType === 'FULL' ? 'badge badge-blue' : 'badge badge-yellow'">
                    {{ t.tripType === 'FULL' ? 'Volledig' : 'Deels' }}
                  </span>
                </td>
                <td>{{ t.kmSnapshot }} km</td>
                <td>€ {{ t.amountSnapshot.toFixed(2) }}</td>
                <td>
                  <span v-if="t.fiscalStatusSnapshot === 'TAX_FREE'" class="text-success">Onbelast</span>
                  <span v-else class="text-danger">Belast</span>
                </td>
                <td>
                  <button @click="deleteTrip(t.id)" class="btn-icon" title="Verwijderen">🗑️</button>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td colspan="3">Totaal deze maand</td>
                <td>€ {{ totalAmount.toFixed(2) }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>

          <p v-else class="empty-state">Geen ritten gevonden voor deze maand.</p>
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

// Settings voor het land van de employee (ratePerKm, deadline, caps, …)
const countrySettings = ref(null);

// Computed
const totalAmount = computed(() => trips.value.reduce((sum, t) => sum + t.amountSnapshot, 0));

async function fetchSettingsForMe() {
  if (!userStore.user?.country) return;
  try {
    const res = await fetch(`${API}/settings/${userStore.user.country}`, { headers: userStore.authHeaders });
    if (res.ok) {
      countrySettings.value = await res.json();
    }
  } catch (e) {
    console.error("Fetch settings error", e);
  }
}

async function init() {
  await userStore.fetchMe();

  // Profile check: zonder stamgegevens kan je geen km bepalen
  hasProfile.value = !!userStore.user?.profile;
  profileLoaded.value = true;

  await fetchSettingsForMe();
  await fetchTrips();
}

async function fetchTrips() {
  try {
    const res = await fetch(`${API}/trip-entries?month=${selectedMonth.value}`, { headers: userStore.authHeaders });
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
    const res = await fetch(`${API}/trip-entries`, {
      method: 'POST',
      headers: userStore.authHeaders,
      body: JSON.stringify({ date: date.value, tripType: tripType.value })
    });

    const data = await res.json();

    if (!res.ok) {
      // Backend errors naar duidelijke NL boodschap
      if (data.error === 'CAP_REACHED_BE_BLOCK') error.value = "⛔ Limiet bereikt (BE plafond). Registratie geblokkeerd.";
      else if (data.error === 'MAX_2_PER_DAY') error.value = "⛔ Maximaal 2 ritten per dag toegestaan.";
      else if (data.error === 'DEADLINE_PASSED') error.value = "⛔ Deadline voor deze maand is verstreken.";
      else if (data.error === 'NO_PROFILE') error.value = "⛔ Profiel ontbreekt: vraag admin om stamgegevens in te vullen.";
      else error.value = data.error || "Er is een fout opgetreden.";
    } else {
      success.value = true;
      await fetchTrips();

      // success message automatisch terug weg
      setTimeout(() => (success.value = false), 2500);
    }
  } catch (e) {
    error.value = "Netwerkfout: Kan server niet bereiken.";
  } finally {
    submitting.value = false;
  }
}

async function deleteTrip(id) {
  if (!confirm("Weet je zeker dat je deze rit wilt verwijderen?")) return;

  try {
    const res = await fetch(`${API}/trip-entries/${id}`, {
      method: 'DELETE',
      headers: userStore.authHeaders
    });

    if (res.ok) {
      await fetchTrips();
    } else {
      const data = await res.json();
      alert(data.error === 'DEADLINE_PASSED'
        ? "Kan niet verwijderen: deadline verstreken."
        : "Kon rit niet verwijderen."
      );
    }
  } catch (e) {
    alert("Netwerkfout bij verwijderen.");
  }
}

onMounted(init);
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1.5rem;
}
.stat-item small { display: block; color: #64748b; margin-bottom: 4px; }
.stat-item strong { font-size: 1.1rem; color: #0f172a; }

.trip-form {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  flex-wrap: wrap;
}
.form-actions { margin-bottom: 1rem; }

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.month-selector { display: flex; align-items: center; gap: 0.5rem; }
.empty-state { text-align: center; color: #64748b; padding: 2rem; }
</style>
