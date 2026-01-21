<!-- frontend/src/views/EmployeeDashboard.vue -->
<template>
  <div class="page">
    <h1>Werknemer Dashboard</h1>
    <div v-if="profileError" class="error">{{ profileError }}</div>
    <div v-else>
      <div v-if="!profileLoaded">
        <p>Profiel laden...</p>
      </div>
      <div v-else-if="!hasProfile">
        <div class="card">
          <h2>Geen profiel</h2>
          <p>Wacht op activatie door admin. Je kan nog niet registreren.</p>
        </div>
      </div>
      <div v-else>
        <div class="card">
          <h2>Nieuwe registratie</h2>
          <form @submit.prevent="submitTrip">
            <label>
              Datum:
              <input type="date" v-model="date" required />
            </label>
            <label>
              Trajecttype:
              <select v-model="tripType" required>
                <option value="FULL">Volledig</option>
                <option value="PARTIAL">Gedeeltelijk</option>
              </select>
            </label>
            <button type="submit" :disabled="submitting">Registreer</button>
          </form>
          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">Registratie opgeslagen!</p>
        </div>
      </div>
      <div class="card">
        <h2>Maandoverzicht ({{ selectedMonth }})</h2>
        <label>
          Maand:
          <input type="month" v-model="selectedMonth" @change="fetchTrips" />
        </label>
        <table v-if="trips.length">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Type</th>
              <th>Afstand (km)</th>
              <th>Bedrag (€)</th>
              <th>Fiscaal statuut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trip in trips" :key="trip.id">
              <td>{{ trip.date }}</td>
              <td>{{ trip.tripType }}</td>
              <td>{{ trip.kmSnapshot }}</td>
              <td>{{ trip.amountSnapshot.toFixed(2) }}</td>
              <td>{{ trip.fiscalStatusSnapshot === 'TAX_FREE' ? 'Onbelast' : 'Belast' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>Geen registraties voor deze maand.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const API = 'http://localhost:3001';
const error = ref('');
const success = ref(false);
const date = ref(new Date().toISOString().slice(0, 10));
const tripType = ref('FULL');
const trips = ref([]);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const profileLoaded = ref(false);
const hasProfile = ref(false);
const profileError = ref('');
const submitting = ref(false);

function getHeaders() {
  return { 'Content-Type': 'application/json', 'x-demo-user-id': localStorage.getItem('demoUserId') };
}

async function checkProfile() {
  profileLoaded.value = false;
  profileError.value = '';
  try {
    const res = await fetch(`${API}/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Kon profiel niet ophalen');
    const me = await res.json();
    hasProfile.value = !!(me && me.profile);
    profileLoaded.value = true;
  } catch (e) {
    profileError.value = e.message;
    profileLoaded.value = true;
  }
}

async function fetchTrips() {
  error.value = '';
  try {
    const res = await fetch(`${API}/trips?month=${selectedMonth.value}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Kon trips niet ophalen');
    trips.value = await res.json();
  } catch (e) {
    error.value = e.message;
    trips.value = [];
  }
}

async function submitTrip() {
  error.value = '';
  success.value = false;
  submitting.value = true;
  try {
    const res = await fetch(`${API}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ date: date.value, tripType: tripType.value })
    });
    if (!res.ok) {
      const data = await res.json();
      if (data.error === 'NO_PROFILE') {
        error.value = 'Je profiel is nog niet geactiveerd. Wacht op admin.';
      } else if (data.error === 'MAX_2_PER_DAY') {
        error.value = 'Maximaal 2 registraties per dag toegestaan.';
      } else if (data.error === 'DEADLINE_PASSED') {
        error.value = 'Deadline voor deze maand is verstreken.';
      } else if (data.error === 'CAP_REACHED_BE_BLOCK') {
        error.value = 'Belastingvrij plafond bereikt. Geen extra registraties toegestaan.';
      } else {
        error.value = data.error || 'Fout bij registratie';
      }
      submitting.value = false;
      return;
    }
    success.value = true;
    await fetchTrips();
    submitting.value = false;
  } catch (e) {
    error.value = e.message;
    submitting.value = false;
  }
}

onMounted(async () => {
  await checkProfile();
  await fetchTrips();
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
.error {
  margin-top: 14px;
  color: #ff6b6b;
}
.success {
  margin-top: 14px;
  color: #4caf50;
}
</style>
