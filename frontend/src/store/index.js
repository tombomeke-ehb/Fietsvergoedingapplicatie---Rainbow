import { defineStore, createPinia } from 'pinia';
import { ref, computed } from 'vue';

const pinia = createPinia();

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const demoUserId = ref(localStorage.getItem('demoUserId'));

  // Computed header voor alle fetch calls
  const authHeaders = computed(() => ({
    'Content-Type': 'application/json',
    'x-demo-user-id': demoUserId.value || ''
  }));

  async function fetchMe() {
    if (!demoUserId.value) return;
    try {
      const res = await fetch('http://localhost:3001/me', { headers: authHeaders.value });
      if (res.ok) user.value = await res.json();
      else logout(); // Token ongeldig
    } catch (e) {
      console.error(e);
    }
  }

  function login(id) {
    localStorage.setItem('demoUserId', id);
    demoUserId.value = id;
    return fetchMe();
  }

  function logout() {
    localStorage.removeItem('demoUserId');
    demoUserId.value = null;
    user.value = null;
  }

  return { user, demoUserId, authHeaders, login, logout, fetchMe };
});

export default pinia;