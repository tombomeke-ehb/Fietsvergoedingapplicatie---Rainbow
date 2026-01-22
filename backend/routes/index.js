import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../store';
import Login from '../views/DemoLogin.vue';
import EmployeeDashboard from '../views/EmployeeDashboard.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import PayrollDashboard from '../views/PayrollDashboard.vue';

const routes = [
  { path: '/', component: Login },
  { 
    path: '/employee', 
    component: EmployeeDashboard, 
    meta: { requiresRole: 'EMPLOYEE' } 
  },
  { 
    path: '/admin', 
    component: AdminDashboard, 
    meta: { requiresRole: 'ADMIN' } 
  },
  { 
    path: '/payroll', 
    component: PayrollDashboard, 
    meta: { requiresRole: ['PAYROLL', 'ADMIN'] } 
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  
  // Als we nog geen user hebben, probeer te fetchen (page refresh)
  if (!userStore.user && localStorage.getItem('demoUserId')) {
    await userStore.fetchMe();
  }

  // Check of route beveiliging nodig heeft
  if (to.meta.requiresRole) {
    if (!userStore.user) {
      return next('/'); // Niet ingelogd -> naar login
    }
    
    const required = to.meta.requiresRole;
    const userRole = userStore.user.role;

    // Check array of single string
    const hasAccess = Array.isArray(required) 
      ? required.includes(userRole) 
      : required === userRole;

    if (!hasAccess) {
      alert("Geen toegang tot deze pagina!");
      return next(from.fullPath || '/'); // Terugsturen
    }
  }

  next();
});

export default router;