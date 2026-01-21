// frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import EmployeeDashboard from '../views/EmployeeDashboard.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import PayrollDashboard from '../views/PayrollDashboard.vue';
import DemoLogin from '../views/DemoLogin.vue';

const routes = [
  { path: '/', name: 'DemoLogin', component: DemoLogin },
  { path: '/employee', name: 'EmployeeDashboard', component: EmployeeDashboard },
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard },
  { path: '/payroll', name: 'PayrollDashboard', component: PayrollDashboard },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
