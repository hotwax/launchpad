import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import { useAuthStore } from "@/store/auth";
import ResetPassword from '@/views/ResetPassword.vue';
import ForgotPassword from '@/views/ForgotPassword.vue';

const loginGuard = (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (authStore.isAuthenticated && !to.query?.redirectUrl) {
    next('/home')
  }
  next();
};

const authGuard = async (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    next('/login')
  }
  next()
};

const resetGuard = async (to: any, from: any, next: any) => {
  const authStore = useAuthStore()
  if (authStore.requirePasswordChange) {
    next('/resetPassword')
    return;
  }
  next()
};

const forgotPassword = async (to: any, from: any, next: any) => {
  const authStore = useAuthStore()

  if (from.path !== '/login' && authStore.isAuthenticated) {
    next('/')
    return;
  }
  next()
  return;
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    beforeEnter: resetGuard
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: loginGuard
  },
  {
    path: '/resetPassword',
    name: 'ResetPassword',
    component: ResetPassword,
    beforeEnter: authGuard
  },
  {
    path: '/forgotPassword',
    name: 'ForgotPassword',
    component: ForgotPassword
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;