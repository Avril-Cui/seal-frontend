import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import RegisterInterests from "../views/RegisterInterests.vue";
import MainSwipe from "../views/MainSwipe.vue";
import Wishlist from "../views/Wishlist.vue";
import Stats from "../views/Stats.vue";
import Settings from "../views/Settings.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/swipe",
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
    },
    {
      path: "/register/interests",
      name: "RegisterInterests",
      component: RegisterInterests,
    },
    {
      path: "/swipe",
      name: "MainSwipe",
      component: MainSwipe,
    },
    {
      path: "/wishlist",
      name: "Wishlist",
      component: Wishlist,
    },
    {
      path: "/stats",
      name: "Stats",
      component: Stats,
    },
    {
      path: "/settings",
      name: "Settings",
      component: Settings,
    },
  ],
});

export default router;
