import { createRouter, createWebHistory } from "@ionic/vue-router";
import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import ResetPassword from "@/views/ResetPassword.vue";

const routes = [
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
    component: Login
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPassword
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
