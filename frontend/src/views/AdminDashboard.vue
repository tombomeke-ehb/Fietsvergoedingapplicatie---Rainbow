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
  try {
    const res = await fetch(`${API}/employees`, { headers: userStore.authHeaders });
    if (!res.ok) throw new Error("Kon werknemers niet ophalen");

    const data = await res.json();

    // Zorg dat we altijd een profile object hebben om in de inputs te binden
    employees.value = data.map(emp => {
      if (!emp.profile) emp.profile = { fullCommuteKm: 0, partialCommuteKm: 0 };
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
      bikeType: emp.bikeType
    };

    const res = await fetch(`${API}/employees/${emp.id}/profile`, {
      method: 'PUT',
      headers: {
        ...userStore.authHeaders,
        'Content-Type': 'application/json' // zorgt dat backend JSON body correct leest
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      profileMsg.value = `Stamgegevens voor ${emp.name} opgeslagen!`;
      setTimeout(() => profileMsg.value = '', 3000);
    } else {
      profileError.value = 'Opslaan mislukt.';
    }
  } catch (e) {
    profileError.value = "Fout bij opslaan profiel.";
  }
}

// --- Settings ---
async function fetchSettings() {
  settingsMsg.value = '';
  settingsError.value = '';

  const res = await fetch(`${API}/settings/${selectedCountry.value}`, { headers: userStore.authHeaders });
  if (res.ok) settings.value = await res.json();
}

async function saveSettings() {
  settingsMsg.value = '';
  settingsError.value = '';

  const res = await fetch(`${API}/settings/${selectedCountry.value}`, {
    method: 'PUT',
    headers: {
      ...userStore.authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings.value)
  });

  if (res.ok) {
    settingsMsg.value = 'Instellingen opgeslagen!';
    setTimeout(() => settingsMsg.value = '', 3000);
  } else {
    const data = await res.json().catch(() => ({}));
    settingsError.value = data.error || 'Kon instellingen niet opslaan.';
  }
}

// --- Export ---
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
      const data = await res.json().catch(() => ({}));
      exportError.value = data.error || "Fout bij starten export.";
    }
  } catch (e) {
    exportError.value = "Netwerkfout.";
  }
}

onMounted(async () => {
  await userStore.fetchMe();
  fetchEmployees();
  fetchSettings();
});
</script>
