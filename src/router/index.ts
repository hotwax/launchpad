import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import { useAuth } from "@/composables/auth";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";

const loginGuard = (to: any, from: any, next: any) => {
  const { isAuthenticated } = useAuth();
  if(isAuthenticated.value && !to.query?.redirectUrl && !to.query?.oms) {
    next("/home")
  }
  next();
};

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "Home",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    beforeEnter: loginGuard
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
