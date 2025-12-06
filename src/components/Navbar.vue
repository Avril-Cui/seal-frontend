<template>
  <nav class="navbar">
    <div class="nav-left">
      <h1 class="nav-title">BYEBUY</h1>
      <img
        src="../assets/pig_sprite.png"
        alt="Pig mascot"
        class="nav-pig-sprite"
      />
    </div>
    <div class="nav-right">
      <button
        @click="goToSwipe"
        :class="['nav-link', { active: currentRoute === '/swipe' }]"
      >
        SWIPESENSE
      </button>
      <button
        @click="goToWishlist"
        :class="['nav-link', { active: currentRoute === '/wishlist' }]"
      >
        PAUSECART
      </button>
      <button
        @click="goToStats"
        :class="['nav-link', { active: currentRoute === '/stats' }]"
      >
        MY STATS
      </button>
      <button
        @click="goToSettings"
        :class="[
          'nav-link',
          'settings-icon',
          { active: currentRoute === '/settings' },
        ]"
      >
        ⚙
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const currentRoute = computed(() => route.path);

const goToSwipe = () => {
  router.push("/swipe");
};

const goToWishlist = () => {
  router.push("/wishlist");
};

const goToStats = () => {
  router.push("/stats");
};

const goToSettings = () => {
  router.push("/settings");
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@700;800;900&display=swap");

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2.5rem;
  border-bottom: 1px solid var(--color-border, #e0e0de);
  background-color: var(--color-bg, #fefefe);
  line-height: 1;
  box-sizing: border-box;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-pig-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.nav-title {
  font-family: "Poppins", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--color-text-primary, #1a1a1a);
  margin: 0;
  line-height: 1;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.nav-link {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--color-text-secondary, #666666);
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.nav-link:hover {
  color: var(--color-text-primary, #1a1a1a);
}

.nav-link.active {
  color: var(--color-text-primary, #1a1a1a);
  position: relative;
}

.nav-link.active::after {
  content: "";
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-text-primary, #1a1a1a);
}

.settings-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
