<template>
  <div>
    <h1>Payroll Dashboard</h1>
    
    <div class="card">
      <div style="margin-bottom: 1rem;">
        <label>Maand Selectie:</label>
        <input type="month" v-model="selectedMonth" @change="fetchExports" />
      </div>

      <div class="table-wrapper">
        <table v-if="exports.length">
          <thead>
            <tr>
              <th>Werknemer</th>
              <th>Km</th>
              <th>Totaal €</th>
              <th>Onbelast</th>
              <th>Belast</th>
              <th>Status</th>
              <th>Actie</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="exp in exports" :key="exp.id">
              <td>{{ exp.user.name }}</td>
              <td>{{ exp.totalKm }}</td>
              <td>€ {{ exp.totalAmount.toFixed(2) }}</td>
              <td>€ {{ (exp.totalTaxFreeAmount||0).toFixed(2) }}</td>
              <td>€ {{ (exp.totalTaxedAmount||0).toFixed(2) }}</td>
              <td>{{ exp.status }}</td>
              <td>
                <button @click="downloadCsv(exp.id)" class="btn-primary" style="font-size: 0.8rem;">
                  ⬇ CSV
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else>Geen exports gevonden. Vraag de admin om een export te triggeren.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../store';

const API = 'http://localhost:3001';
const userStore = useUserStore();
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const exports = ref([]);

async function fetchExports() {
  const res = await fetch(`${API}/exports?month=${selectedMonth.value}`, { headers: userStore.authHeaders });
  if (res.ok) exports.value = await res.json();
}

async function downloadCsv(id) {
  const res = await fetch(`${API}/exports/${id}/download`, { headers: userStore.authHeaders });
  if (res.ok) {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${id}.csv`;
    a.click();

    // netjes opruimen
    window.URL.revokeObjectURL(url);
  } else {
    alert("Download mislukt");
  }
}


onMounted(() => {
  userStore.fetchMe().then(fetchExports);
});
</script>