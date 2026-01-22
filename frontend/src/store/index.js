// frontend/src/index.js
import { defineStore, createPinia } from 'pinia';
import { ref } from 'vue';

const pinia = createPinia();
const API = 'http://localhost:3001';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);

  // demoUserId wordt als string bewaard (localStorage werkt met strings)
  const demoUserId = ref(localStorage.getItem('demoUserId'));

  /**
   * ✅ Gebruik een FUNCTION i.p.v. computed,
   * zodat je nooit meer ".value" kan vergeten bij fetch headers.
   *
   * json=true => voegt Content-Type toe (POST/PUT met body)
   * json=false => enkel auth header (GET)
   */
  function getAuthHeaders(json = false) {
    const headers = {};
    if (demoUserId.value) headers['x-demo-user-id'] = String(demoUserId.value);
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
  }

  /**
   * Haalt de ingelogde user op via /me.
   * Als dit faalt (401/403), wissen we local state zodat de UI terug naar login gaat.
   */
  async function fetchMe() {
    if (!demoUserId.value) {
      user.value = null;
      return { ok: false, error: 'NO_SESSION' };
    }

    try {
      const res = await fetch(`${API}/me`, { headers: getAuthHeaders(false) });

      if (res.ok) {
        user.value = await res.json();
        return { ok: true };
      } else {
        logout();
        return { ok: false, error: 'AUTH_FAILED' };
      }
    } catch (e) {
      console.error('fetchMe error:', e);
      return { ok: false, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Demo login via backend.
   * Return value: { ok: boolean, error?: string }
   */
  async function login(id) {
    try {
      const res = await fetch(`${API}/demo/login`, {
        method: 'POST',
        headers: getAuthHeaders(true), // Content-Type + x-demo-user-id (als al gezet)
        body: JSON.stringify({ userId: Number(id) })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        logout();
        return { ok: false, error: data.error || 'LOGIN_FAILED' };
      }

      // pas hier pas localStorage aan: login hangt af van backend
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

  function logout() {
    localStorage.removeItem('demoUserId');
    demoUserId.value = null;
    user.value = null;
  }

  return { user, demoUserId, getAuthHeaders, login, logout, fetchMe };
});

export default pinia;
