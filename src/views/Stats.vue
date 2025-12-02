<template>
  <div class="stats-container">
    <nav class="navbar">
      <div class="nav-left">
        <h1 class="nav-title">BYEBUY</h1>
      </div>
      <div class="nav-right">
        <button @click="goToSwipe" class="nav-link">SWIPESENSE</button>
        <button @click="goToWishlist" class="nav-link">PAUSE CART</button>
        <button @click="goToStats" class="nav-link active">STATS</button>
        <button @click="goToSettings" class="nav-link settings-icon">⚙</button>
      </div>
    </nav>

    <div class="stats-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">{{ userName }}'s Shopping Insights</h1>
        <p class="page-subtitle">Track your spending habits and savings progress</p>
      </div>

      <!-- Exportable Stats Section -->
      <div ref="exportSection" class="export-section">
        <!-- Export Header (only visible in export) -->
        <div class="export-header">
          <h1 class="export-title">BYEBUY Shopping Insights</h1>
          <p class="export-date">{{ currentDate }}</p>
        </div>

        <!-- Stats Summary -->
        <div class="stats-summary">
        <div class="stat-box">
          <div class="stat-value positive">$847</div>
          <div class="stat-label">Total Saved</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">32</div>
          <div class="stat-label">Items Reviewed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value positive">68%</div>
          <div class="stat-label">Rejection Rate</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">$2.4k</div>
          <div class="stat-label">Impulse Avoided</div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="stats-grid">
        <!-- Savings Graph -->
        <div class="card graph-card">
          <div class="graph-header">
            <div>
              <h2 class="card-title">Savings Progress</h2>
              <div class="graph-metric">24%</div>
              <div class="graph-metric-label">average saved</div>
            </div>
          </div>
          <div class="graph-container">
            <svg class="graph-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
              <!-- Grid lines -->
              <line class="graph-grid" x1="0" y1="50" x2="400" y2="50" />
              <line class="graph-grid" x1="0" y1="100" x2="400" y2="100" />
              <line class="graph-grid" x1="0" y1="150" x2="400" y2="150" />

              <!-- Area under curve -->
              <path class="graph-area" d="M 0 180 L 0 160 Q 50 140, 100 130 T 200 110 T 300 90 L 400 70 L 400 200 L 0 200 Z" />

              <!-- Line graph -->
              <path class="graph-line" d="M 0 160 Q 50 140, 100 130 T 200 110 T 300 90 L 400 70" />

              <!-- Labels -->
              <text class="graph-label" x="0" y="195">Jan</text>
              <text class="graph-label" x="100" y="195">Mar</text>
              <text class="graph-label" x="200" y="195">May</text>
              <text class="graph-label" x="300" y="195">Jul</text>
              <text class="graph-label" x="385" y="195">Sep</text>
            </svg>
          </div>
          <button class="export-button" @click="exportStats">
            <span class="export-icon">☁</span>
            EXPORT DATA
          </button>
        </div>

        <!-- AI Insights -->
        <div class="card insights-card">
          <h2 class="card-title">Behavioral Insights</h2>
          <div class="insights-wrapper">
            <!-- Trend Alert Section -->
            <div class="insight-section">
              <div class="mascot">🐷</div>
              <div class="insight-content">
                <span class="insight-tag">Trend Alert</span>
                <p v-if="isLoadingInsights" class="insight-text">
                  Loading insights...
                </p>
                <p v-else class="insight-text">
                  {{ aiTrendAlert }}
                </p>
              </div>
            </div>

            <!-- Improvement Suggestions Section -->
            <div class="insight-section">
              <div class="mascot">🐷</div>
              <div class="insight-content">
                <span class="insight-tag green">Improvement Suggestions</span>
                <ul v-if="isLoadingInsights" class="suggestions-list">
                  <li class="suggestion-item">
                    <span class="suggestion-bullet">→</span>
                    <span>Loading suggestions...</span>
                  </li>
                </ul>
                <ul v-else class="suggestions-list">
                  <li v-for="(suggestion, index) in aiSuggestions" :key="index" class="suggestion-item">
                    <span class="suggestion-bullet">→</span>
                    <span>{{ suggestion }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <!-- End Exportable Section -->

      <!-- Recent Purchases -->
      <div class="card purchases-section">
          <h2 class="card-title">Recent Purchases</h2>
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
    </div>

    <!-- Hidden Poster Template for Export -->
    <div ref="posterTemplate" class="poster-template">
      <div class="poster-container">
        <!-- Poster Header -->
        <div class="poster-header">
          <div class="poster-logo">BYEBUY</div>
          <div class="poster-date">{{ currentDate }}</div>
        </div>

        <!-- Poster Main Content -->
        <div class="poster-main">
          <h1 class="poster-title">{{ userName }}'s Shopping Insights</h1>

          <!-- Key Metrics Grid -->
          <div class="poster-metrics">
            <div class="poster-metric-card highlight">
              <div class="poster-metric-value">$847</div>
              <div class="poster-metric-label">Total Saved</div>
            </div>
            <div class="poster-metric-card">
              <div class="poster-metric-value">68%</div>
              <div class="poster-metric-label">Rejection Rate</div>
            </div>
          </div>

          <!-- Savings Progress -->
          <div class="poster-graph-section">
            <div class="poster-section-title">Savings Progress</div>
            <div class="poster-graph-container">
              <div class="poster-graph-metric">24%</div>
              <div class="poster-graph-label">average saved</div>
              <svg class="poster-graph-svg" viewBox="0 0 400 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="posterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#8BA888;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#8BA888;stop-opacity:0.05" />
                  </linearGradient>
                </defs>
                <path class="poster-graph-area" d="M 0 110 L 0 90 Q 50 80, 100 70 T 200 50 T 300 35 L 400 20 L 400 120 L 0 120 Z" fill="url(#posterGradient)" />
                <path class="poster-graph-line" d="M 0 90 Q 50 80, 100 70 T 200 50 T 300 35 L 400 20" />
              </svg>
            </div>
          </div>

          <!-- Behavioral Insight -->
          <div class="poster-insight-section">
            <div class="poster-section-title">Key Insight</div>
            <div class="poster-insight-content">
              <div class="poster-mascot">🐷</div>
              <div class="poster-insight-text">
                {{ aiTrendAlert }}
              </div>
            </div>
          </div>
        </div>

        <!-- Poster Footer -->
        <div class="poster-footer">
          <div class="poster-footer-text">Track your spending habits with BYEBUY</div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreviewModal" class="modal-overlay" @click="closePreview">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Preview Your Stats</h2>
          <button class="modal-close" @click="closePreview">✕</button>
        </div>
        <div class="modal-body">
          <img v-if="previewImage" :src="previewImage" alt="Stats Preview" class="preview-image" />
        </div>
        <div class="modal-footer">
          <button class="modal-button secondary" @click="closePreview">Cancel</button>
          <button class="modal-button primary" @click="downloadImage">
            <span class="download-icon">⬇</span>
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { useStatsAPI } from "../composables/useStatsAPI";
import html2canvas from "html2canvas";

const router = useRouter();
const { currentUser } = useAuth();
const { fetchWishlist, getSwipeStats, getSwipeComments, getAIWishListInsight, buildInsightPrompt } = useStatsAPI();

const exportSection = ref(null);
const posterTemplate = ref(null);
const showPreviewModal = ref(false);
const previewImage = ref(null);

// AI Insights
const aiTrendAlert = ref("Oink oink! Our analysis shows that you tend to make most impulsive purchases on weekends, particularly Saturday afternoons.");
const aiSuggestions = ref([
  "Set a 24-hour waiting period before making weekend purchases",
  "Create a wishlist and review items after 7 days before buying",
  "Set a monthly spending limit and track progress weekly",
  "Avoid shopping apps during high-risk hours (Sat 2-6pm)"
]);
const isLoadingInsights = ref(false);

// User name
const userName = computed(() => {
  if (currentUser?.value?.email) {
    const emailName = currentUser.value.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  return "Alex"; // Fallback
});

const recentPurchases = ref([
  { id: 1, name: "Wireless Headphones", date: "2 weeks ago" },
  { id: 2, name: "Running Shoes", date: "1 month ago" },
  { id: 3, name: "Coffee Maker", date: "2 months ago" },
  { id: 4, name: "Yoga Mat", date: "3 months ago" },
  { id: 5, name: "Desk Lamp", date: "3 months ago" },
  { id: 6, name: "Phone Case", date: "4 months ago" },
]);

const currentDate = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const graphPoints = computed(() => {
  // Simple upward trending line
  return "0,180 50,160 100,140 150,120 200,100 250,80 300,60";
});

// Fetch AI insights based on wishlist and swipe data
const fetchAIInsights = async () => {
  if (!currentUser?.value?.uid) {
    console.log('No current user, skipping AI insights');
    return;
  }

  isLoadingInsights.value = true;
  try {
    // 1. Fetch user's wishlist
    const wishlistItems = await fetchWishlist(currentUser.value.uid);

    if (wishlistItems.length === 0) {
      console.log('No wishlist items found');
      isLoadingInsights.value = false;
      return;
    }

    // 2. For each item, get swipe stats and comments
    const swipeDataMap = {};
    for (const item of wishlistItems) {
      const stats = await getSwipeStats(currentUser.value.uid, item._id);
      const comments = await getSwipeComments(currentUser.value.uid, item._id);
      swipeDataMap[item._id] = { stats, comments };
    }

    // 3. Build prompt with all data
    const prompt = buildInsightPrompt(wishlistItems, swipeDataMap);

    // 4. Get AI response
    const response = await getAIWishListInsight(currentUser.value.uid, prompt);

    if (!response) {
      console.error('No AI response received');
      return;
    }

    // 5. Parse JSON response and display
    try {
      const parsed = JSON.parse(response);
      if (parsed.trendAlert && parsed.improvementSuggestions) {
        aiTrendAlert.value = parsed.trendAlert;
        aiSuggestions.value = parsed.improvementSuggestions;
      } else {
        console.error('Invalid AI response format:', parsed);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw response:', response);
    }
  } catch (error) {
    console.error('Error fetching AI insights:', error);
  } finally {
    isLoadingInsights.value = false;
  }
};

// Fetch AI insights on component mount
onMounted(() => {
  fetchAIInsights();
});

const exportStats = async () => {
  if (!posterTemplate.value) return;

  try {
    // Temporarily show the poster template
    posterTemplate.value.style.display = 'block';

    // Small delay to ensure rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture the poster as canvas
    const canvas = await html2canvas(posterTemplate.value, {
      backgroundColor: '#FEFEFE',
      scale: 3, // High quality for poster
      logging: false,
      useCORS: true,
      width: 1080,
      height: 1920,
    });

    // Hide the poster template again
    posterTemplate.value.style.display = 'none';

    // Convert canvas to data URL for preview
    const imageDataUrl = canvas.toDataURL('image/png');
    previewImage.value = imageDataUrl;
    showPreviewModal.value = true;

  } catch (error) {
    console.error('Error generating stats poster:', error);
    alert('Failed to generate stats poster. Please try again.');
    if (posterTemplate.value) {
      posterTemplate.value.style.display = 'none';
    }
  }
};

const closePreview = () => {
  showPreviewModal.value = false;
  previewImage.value = null;
};

const downloadImage = () => {
  if (!previewImage.value) return;

  // Create download link
  const link = document.createElement('a');
  const fileName = `BYEBUY-Stats-${new Date().toISOString().split('T')[0]}.png`;
  link.download = fileName;
  link.href = previewImage.value;
  link.click();

  // Close modal after download
  closePreview();
};

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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

.stats-container {
  /* Color Variables */
  --color-bg: #FEFEFE;
  --color-bg-secondary: #F8F8F6;
  --color-bg-tertiary: #F0F0EE;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #E0E0DE;
  --color-border-dark: #333333;
  --color-accent-green: #8BA888;
  --color-accent-red: #D47B7B;
  --color-accent-pink: #E8B4B4;
  --font-primary: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* Container Styles */
  min-height: 100vh;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-secondary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Navigation */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2.5rem;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg);
}

.nav-title {
  font-family: var(--font-primary);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.nav-link {
  font-family: var(--font-primary);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.nav-link:hover {
  color: var(--color-text-primary);
}

.nav-link.active {
  color: var(--color-text-primary);
  position: relative;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--color-text-primary);
}

.settings-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Main Content */
.stats-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2.5rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-family: var(--font-primary);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 400;
}

/* Export Section */
.export-section {
  position: relative;
}

.export-header {
  display: none; /* Hidden by default, shown only during export */
  text-align: center;
  padding: 2rem 0 1.5rem 0;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.export-title {
  font-family: var(--font-primary);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.export-date {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 400;
}

/* Grid Layout */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.purchases-section {
  grid-column: 1 / -1;
}

/* Card Styles */
.card {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.card:hover {
  border-color: var(--color-border-dark);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  color: var(--color-text-secondary);
}

/* Purchases Section */
.purchases-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.purchase-item {
  display: flex;
  gap: 0.875rem;
  padding: 0.875rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.purchase-item:hover {
  background-color: var(--color-bg-tertiary);
  transform: translateY(-1px);
}

.purchase-image {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--color-bg-tertiary) 0%, var(--color-bg-secondary) 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.image-placeholder {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}

.purchase-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.125rem;
}

.purchase-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.purchase-date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Graph Section */
.graph-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.graph-metric {
  font-family: var(--font-primary);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-accent-green);
  letter-spacing: -0.02em;
}

.graph-metric-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.125rem;
}

.graph-container {
  flex: 1;
  position: relative;
  min-height: 180px;
  background-color: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.graph-svg {
  width: 100%;
  height: 100%;
}

.graph-line {
  fill: none;
  stroke: var(--color-accent-green);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.graph-area {
  fill: var(--color-accent-green);
  opacity: 0.1;
}

.graph-grid {
  stroke: var(--color-border);
  stroke-width: 1;
  opacity: 0.5;
}

.graph-label {
  font-size: 0.75rem;
  fill: var(--color-text-tertiary);
  font-family: var(--font-secondary);
}

.export-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  border: none;
  border-radius: 8px;
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-button:hover {
  background-color: #000000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.export-icon {
  font-size: 1rem;
}

/* Insights Section */
.insights-card {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
}

.insights-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.insight-section {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.insight-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.mascot {
  font-size: 2.5rem;
  flex-shrink: 0;
  filter: grayscale(20%);
}

.insight-content {
  flex: 1;
}

.insight-tag {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background-color: var(--color-accent-pink);
  color: var(--color-text-primary);
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: 0.625rem;
  text-transform: uppercase;
}

.insight-tag.green {
  background-color: var(--color-accent-green);
}

.insight-text {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.suggestion-bullet {
  color: var(--color-accent-green);
  font-weight: 700;
  flex-shrink: 0;
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  padding: 1rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;
}

.stat-box:hover {
  border-color: var(--color-border-dark);
  transform: translateY(-2px);
}

.stat-value {
  font-family: var(--font-primary);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.stat-value.positive {
  color: var(--color-accent-green);
}

.stat-value.negative {
  color: var(--color-accent-red);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .navbar {
    padding: 1.5rem 2rem;
  }

  .stats-content {
    padding: 3rem 2rem;
  }
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .nav-right {
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: 2rem;
  }

  .stats-summary {
    grid-template-columns: 1fr;
  }

  .insight-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-value {
    font-size: 1.75rem;
  }
}

/* Poster Template Styles */
.poster-template {
  position: fixed;
  left: -9999px;
  top: -9999px;
  display: none;
  width: 1080px;
  height: 1920px;
}

.poster-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FEFEFE 0%, #F8F8F6 100%);
  padding: 80px 60px;
  font-family: var(--font-secondary);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.poster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60px;
  padding-bottom: 30px;
  border-bottom: 3px solid var(--color-border-dark);
}

.poster-logo {
  font-family: var(--font-primary);
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-primary);
}

.poster-date {
  font-size: 24px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.poster-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 50px;
}

.poster-title {
  font-family: var(--font-primary);
  font-size: 72px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.1;
}

.poster-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.poster-metric-card {
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 24px;
  padding: 50px 40px;
  text-align: center;
  transition: all 0.3s ease;
}

.poster-metric-card.highlight {
  background: linear-gradient(135deg, var(--color-accent-green) 0%, #7A9877 100%);
  border-color: var(--color-accent-green);
}

.poster-metric-value {
  font-family: var(--font-primary);
  font-size: 96px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  margin-bottom: 15px;
}

.poster-metric-card.highlight .poster-metric-value {
  color: var(--color-bg);
}

.poster-metric-label {
  font-size: 28px;
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.poster-metric-card.highlight .poster-metric-label {
  color: var(--color-bg);
}

.poster-graph-section {
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 24px;
  padding: 40px;
}

.poster-section-title {
  font-family: var(--font-primary);
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: 30px;
}

.poster-graph-container {
  position: relative;
}

.poster-graph-metric {
  font-family: var(--font-primary);
  font-size: 80px;
  font-weight: 700;
  color: var(--color-accent-green);
  letter-spacing: -0.02em;
  margin-bottom: 10px;
}

.poster-graph-label {
  font-size: 24px;
  color: var(--color-text-secondary);
  margin-bottom: 30px;
}

.poster-graph-svg {
  width: 100%;
  height: 200px;
}

.poster-graph-line {
  fill: none;
  stroke: var(--color-accent-green);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.poster-insight-section {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  border: 2px solid var(--color-border);
  border-radius: 24px;
  padding: 40px;
}

.poster-insight-content {
  display: flex;
  gap: 30px;
  align-items: center;
  margin-top: 20px;
}

.poster-mascot {
  font-size: 96px;
  flex-shrink: 0;
}

.poster-insight-text {
  font-size: 28px;
  line-height: 1.6;
  color: var(--color-text-primary);
  font-weight: 400;
}

.poster-footer {
  margin-top: auto;
  padding-top: 40px;
  border-top: 2px solid var(--color-border);
  text-align: center;
}

.poster-footer-text {
  font-family: var(--font-primary);
  font-size: 24px;
  color: var(--color-text-secondary);
  font-weight: 500;
  letter-spacing: 0.05em;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-bg);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-family: var(--font-primary);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-border);
  justify-content: flex-end;
}

.modal-button {
  font-family: var(--font-primary);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: 0.02em;
}

.modal-button.secondary {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.modal-button.secondary:hover {
  background-color: var(--color-bg-secondary);
}

.modal-button.primary {
  background-color: var(--color-text-primary);
  color: var(--color-bg);
}

.modal-button.primary:hover {
  background-color: #000000;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.download-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    max-width: 100%;
  }

  .preview-image {
    max-height: 50vh;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
