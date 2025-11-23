<template>
  <div class="stats-container">
    <nav class="navbar">
      <div class="nav-left">
        <h1 class="nav-title">BYEBUY</h1>
      </div>
      <div class="nav-right">
        <button @click="goToSwipe" class="nav-link">SWIPE</button>
        <button @click="goToWishlist" class="nav-link">WISHLIST</button>
        <button @click="goToStats" class="nav-link active">STATS</button>
        <button @click="goToSettings" class="nav-link settings-icon">⚙</button>
      </div>
    </nav>

    <div class="stats-content">
      <div class="stats-grid">
        <div class="purchases-section">
          <h2 class="section-title">RECENT PURCHASES</h2>
          <div class="purchases-list">
            <div
              v-for="purchase in recentPurchases"
              :key="purchase.id"
              class="purchase-item"
            >
              <div class="purchase-image">
                <div class="image-placeholder">IMG</div>
              </div>
              <div class="purchase-details">
                <p class="purchase-name">{{ purchase.name }}</p>
                <p class="purchase-date">{{ purchase.date }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="graph-section">
          <div class="graph-container">
            <div class="graph-title">% saved</div>
            <div class="graph">
              <svg viewBox="0 0 300 200" class="graph-svg">
                <polyline
                  :points="graphPoints"
                  fill="none"
                  stroke="#2D0000"
                  stroke-width="3"
                />
                <text x="0" y="190" class="graph-label">time (months)</text>
              </svg>
            </div>
          </div>

          <button class="export-button">
            <span class="export-icon">☁</span>
            EXPORT
          </button>
        </div>
      </div>

      <div class="mascot-section">
        <div class="mascot">
          <div class="pig">🐷</div>
          <div class="speech-bubble">
            <p>
              Oink oink! trends indicate that you make most impulsive purchases
              on weekends. hmm...
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const recentPurchases = ref([
  { id: 1, name: "Purchase Item 1", date: "2 weeks ago" },
  { id: 2, name: "Purchase Item 2", date: "1 month ago" },
  { id: 3, name: "Purchase Item 3", date: "2 months ago" },
]);

const graphPoints = computed(() => {
  // Simple upward trending line
  return "0,180 50,160 100,140 150,120 200,100 250,80 300,60";
});

const goToSwipe = () => {
  router.push("/swipe");
};

const goToWishlist = () => {
  router.push("/wishlist");
};

const goToSettings = () => {
  router.push("/settings");
};
</script>

<style scoped>
.stats-container {
  min-height: 100vh;
  background-color: #f5f0e1;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #2d0000;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 0;
  text-transform: uppercase;
}

.stats-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.purchases-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.purchase-item {
  display: flex;
  gap: 1rem;
  border: 2px solid #2d0000;
  border-radius: 12px;
  padding: 1rem;
  background-color: #f5f0e1;
}

.purchase-image {
  width: 80px;
  height: 80px;
  border: 2px solid #2d0000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f0e1;
  flex-shrink: 0;
}

.image-placeholder {
  font-size: 0.9rem;
  font-weight: 600;
  color: #87875a;
}

.purchase-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
}

.purchase-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.purchase-date {
  font-size: 0.85rem;
  margin: 0;
  color: #2d0000;
}

.graph-container {
  border: 2px solid #2d0000;
  border-radius: 12px;
  padding: 1.5rem;
  background-color: #f5f0e1;
  margin-bottom: 1.5rem;
}

.graph-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.graph {
  width: 100%;
  height: 200px;
}

.graph-svg {
  width: 100%;
  height: 100%;
}

.graph-label {
  font-size: 0.8rem;
  fill: #2d0000;
}

.export-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
}

.export-icon {
  font-size: 1.2rem;
}

.mascot-section {
  border: 2px solid #2d0000;
  border-radius: 12px;
  padding: 2rem;
  background-color: #f5f0e1;
}

.mascot {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.pig {
  font-size: 3rem;
  flex-shrink: 0;
}

.speech-bubble {
  flex: 1;
  border: 2px solid #2d0000;
  border-radius: 12px;
  padding: 1.5rem;
  background-color: #f5f0e1;
  position: relative;
}

.speech-bubble::before {
  content: "";
  position: absolute;
  left: -10px;
  top: 20px;
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid #2d0000;
}

.speech-bubble::after {
  content: "";
  position: absolute;
  left: -8px;
  top: 20px;
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid #f5f0e1;
}

.speech-bubble p {
  margin: 0;
  line-height: 1.6;
  font-size: 0.95rem;
}

.nav-link {
  border: none;
  background: none;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  color: #2d0000;
  font-size: 0.9rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-link:hover {
  text-decoration: underline;
}

.nav-link.active {
  text-decoration: underline;
}

.nav-link.settings-icon {
  font-size: 1.2rem;
  padding: 0.5rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .mascot {
    flex-direction: column;
    align-items: center;
  }

  .speech-bubble::before,
  .speech-bubble::after {
    display: none;
  }
}
</style>
