import { defineStore, createPinia } from 'pinia';
import { ref, computed } from 'vue';

const pinia = createPinia();

const API = 'http://localhost:3001';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);

  // demoUserId wordt als string bewaard (localStorage werkt met strings)
  const demoUserId = ref(localStorage.getItem('demoUserId'));

  /**
   * Headers voor requests die auth vereisen.
   * - Content-Type: json voor POST/PUT bodies
   * - x-demo-user-id: voor de PoC "auth"
   *
   * Tip: als demoUserId leeg is, sturen we de header liever niet mee.
   */
  const authHeaders = computed(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (demoUserId.value) headers['x-demo-user-id'] = String(demoUserId.value);
    return headers;
  });

  /**
   * Haalt de ingelogde user op via /me.
   * Als dit faalt (401/403), wissen we local state zodat de UI terug naar login gaat.
   */
  async function fetchMe() {
    if (!demoUserId.value) return;

    try {
      const res = await fetch(`${API}/me`, { headers: authHeaders.value });

      if (res.ok) {
        user.value = await res.json();
      } else {
        // Onbekende/ongeldige demo user id
        logout();
      }
    } catch (e) {
      console.error('fetchMe error:', e);
      // Bij netwerkfout laten we user staan (handig tijdens dev),
      // maar je kan hier ook logout doen als je dat liever hebt.
    }
  }

  /**
   * Demo login via backend.
   * Backend kan DEMO_MODE afdwingen en controleert of de user bestaat.
   *
   * Return value: { ok: boolean, error?: string }
   * Zo kan je DemoLogin.vue een nette fout tonen (bv. DEMO_MODE_DISABLED).
   */
  async function login(id) {
    try {
      const res = await fetch(`${API}/demo/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(id) })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Zorg dat de UI niet in een half-ingelogde state zit
        logout();
        return { ok: false, error: data.error || 'LOGIN_FAILED' };
      }

      // Pas hier pas localStorage aan: zo is "login" echt afhankelijk van backend.
      localStorage.setItem('demoUserId', String(id));
      demoUserId.value = String(id);

      await fetchMe();
      return { ok: true };
    } catch (e) {
      console.error('login error:', e);
      logout();
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Logout in PoC: state resetten + localStorage wissen.
   * (Je kan optioneel ook /demo/logout callen, maar er is geen echte sessie.)
   */
  function logout() {
    localStorage.removeItem('demoUserId');
    demoUserId.value = null;
    user.value = null;
  }

  return { user, demoUserId, authHeaders, login, logout, fetchMe };
});

export default pinia;
