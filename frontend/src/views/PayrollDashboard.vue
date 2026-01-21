<!-- frontend/src/views/PayrollDashboard.vue -->
<template>
  <div class="page">
    <h1>Payroll Dashboard</h1>
    <div class="card">
      <h2>Exports per maand</h2>
      <label>Maand: <input type="month" v-model="selectedMonth" @change="fetchExports" /></label>
      <table v-if="exports.length">
        <thead>
          <tr>
            <th>Werknemer</th>
            <th>Totaal km</th>
            <th>Totaal bedrag (€)</th>
            <th>Onbelast (€)</th>
            <th>Belast (€)</th>
            <th>Status</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exp in exports" :key="exp.id">
            <td>{{ exp.user.name }}</td>
            <td>{{ exp.totalKm }}</td>
            <td>{{ exp.totalAmount.toFixed(2) }}</td>
            <td>{{ exp.totalTaxFreeAmount?.toFixed(2) ?? '-' }}</td>
            <td>{{ exp.totalTaxedAmount?.toFixed(2) ?? '-' }}</td>
            <td>{{ exp.status }}</td>
            <td><button @click="downloadExport(exp.id)">Download</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else>Geen exports voor deze maand.</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const API = 'http://localhost:3001';
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const exports = ref([]);
const error = ref('');

function getHeaders() {
  return { 'Content-Type': 'application/json', 'x-demo-user-id': localStorage.getItem('demoUserId') };
}

async function fetchExports() {
  error.value = '';
  try {
    const res = await fetch(`${API}/exports?month=${selectedMonth.value}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Kon exports niet ophalen');
    exports.value = await res.json();
  } catch (e) {
    error.value = e.message;
    exports.value = [];
  }
}

async function downloadExport(id) {
  // Voor PoC: download als JSON
  try {
    const res = await fetch(`${API}/exports/${id}/download`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Download mislukt');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${id}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    error.value = e.message;
  }
}

fetchExports();
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
</style>
