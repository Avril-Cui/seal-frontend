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
      redirect: "/login",
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
      meta: { requiresGuest: true },
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
      meta: { requiresAuth: true },
    },
    {
      path: "/wishlist",
      name: "Wishlist",
      component: Wishlist,
      meta: { requiresAuth: true },
    },
    {
      path: "/stats",
      name: "Stats",
      component: Stats,
      meta: { requiresAuth: true },
    },
    {
      path: "/settings",
      name: "Settings",
      component: Settings,
      meta: { requiresAuth: true },
    },
  ],
});

// Route guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next("/swipe");
  } else {
    next();
  }
});

export default router;
