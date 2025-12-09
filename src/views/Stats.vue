<template>
  <div class="stats-container">
    <Navbar />

    <div class="stats-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">{{ userName }}'s Shopping Insights</h1>
        <p class="page-subtitle">
          Track your spending habits and savings progress
        </p>
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
          <div
            class="stat-box"
            @mouseenter="hoveredStat = 'totalSaved'"
            @mouseleave="hoveredStat = null"
          >
            <div class="stat-value positive">${{ totalSaved.toFixed(2) }}</div>
            <div class="stat-label">Total Saved</div>
            <div v-if="hoveredStat === 'totalSaved'" class="stat-tooltip">
              This is how much is in your PauseCart that you didn't buy!
            </div>
          </div>
          <div
            class="stat-box"
            @mouseenter="hoveredStat = 'totalBought'"
            @mouseleave="hoveredStat = null"
          >
            <div class="stat-value positive">${{ totalBought.toFixed(2) }}</div>
            <div class="stat-label">Total Bought</div>
            <div v-if="hoveredStat === 'totalBought'" class="stat-tooltip">
              Total amount you spent on items you actually bought from your
              PauseCart
            </div>
          </div>
          <div
            class="stat-box"
            @mouseenter="hoveredStat = 'itemsBought'"
            @mouseleave="hoveredStat = null"
          >
            <div class="stat-value">{{ itemsBought }}</div>
            <div class="stat-label">Items Bought</div>
            <div v-if="hoveredStat === 'itemsBought'" class="stat-tooltip">
              Number of items you marked as purchased from your PauseCart
            </div>
          </div>
          <div
            class="stat-box"
            @mouseenter="hoveredStat = 'rejectionRate'"
            @mouseleave="hoveredStat = null"
          >
            <div class="stat-value">
              {{ (rejectionRate ?? 0) + "%" }}
            </div>
            <div class="stat-label">Rejection Rate</div>
            <div v-if="hoveredStat === 'rejectionRate'" class="stat-tooltip">
              The total percentage across all your items that were swiped that
              other people told you to not buy
            </div>
          </div>
          <div
            class="stat-box"
            @mouseenter="hoveredStat = 'itemsReviewed'"
            @mouseleave="hoveredStat = null"
          >
            <div class="stat-value">
              {{ itemsReviewed ?? 0 }}
            </div>
            <div class="stat-label">Items Reviewed</div>
            <div v-if="hoveredStat === 'itemsReviewed'" class="stat-tooltip">
              How many items you've reviewed in SwipeSense to help others make
              mindful decisions
            </div>
          </div>
        </div>

        <!-- Main Grid -->
        <div class="stats-grid">
          <!-- Progress Graph -->
          <div class="card graph-card">
            <div class="graph-header">
              <div>
                <div class="graph-controls">
                  <h2 class="card-title">Purchase Progress</h2>
                  <div class="view-toggle">
                    <button
                      @click="viewMode = 'day'"
                      :class="[
                        'view-toggle-btn',
                        { active: viewMode === 'day' },
                      ]"
                    >
                      Daily
                    </button>
                    <button
                      @click="viewMode = 'month'"
                      :class="[
                        'view-toggle-btn',
                        { active: viewMode === 'month' },
                      ]"
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                <div class="graph-metric">
                  ${{ currentGraphTotal.toFixed(2) }}
                </div>
                <div class="graph-metric-label">
                  {{
                    viewMode === "day"
                      ? "total purchased (past 7 days)"
                      : "total purchased (past month)"
                  }}
                </div>
              </div>
            </div>

            <div class="graph-navigation">
              <button @click="navigateGraph(-1)" class="nav-btn">←</button>
              <span class="date-range">{{ dateRangeLabel }}</span>
              <button
                @click="navigateGraph(1)"
                class="nav-btn"
                :disabled="offset === 0"
              >
                →
              </button>
            </div>

            <div
              class="graph-container"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              <div class="graph-wrapper">
                <!-- Y-axis labels -->
                <div class="y-axis-labels">
                  <div
                    v-for="(label, index) in yAxisLabels"
                    :key="index"
                    class="y-axis-label"
                    :style="{ top: label.position + '%' }"
                  >
                    ${{ label.value }}
                  </div>
                </div>

                <svg
                  class="graph-svg"
                  viewBox="0 0 500 300"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <!-- Grid lines -->
                  <line
                    v-for="(label, index) in yAxisLabels"
                    :key="'grid-' + index"
                    class="graph-grid"
                    :x1="0"
                    :y1="label.y"
                    :x2="500"
                    :y2="label.y"
                  />

                  <!-- Y-axis line -->
                  <line class="axis-line" x1="0" y1="0" x2="0" y2="280" />

                  <!-- X-axis line -->
                  <line class="axis-line" x1="0" y1="280" x2="500" y2="280" />

                  <!-- Data points and line -->
                  <path
                    v-if="graphPath"
                    class="graph-area"
                    :d="graphAreaPath"
                  />
                  <path v-if="graphPath" class="graph-line" :d="graphPath" />

                  <!-- Interactive points -->
                  <g v-for="(point, index) in graphPoints" :key="index">
                    <circle
                      :cx="point.x"
                      :cy="point.y"
                      r="5"
                      class="graph-point"
                      @mouseenter="selectPoint(index)"
                      @mouseleave="selectedPoint = null"
                      :class="{ active: selectedPoint === index }"
                    />
                  </g>

                  <!-- X-axis labels -->
                  <text
                    v-for="(label, index) in xAxisLabels"
                    :key="index"
                    class="graph-label"
                    :x="label.x"
                    y="295"
                    text-anchor="middle"
                  >
                    {{ label.text }}
                  </text>
                </svg>
              </div>

              <!-- Tooltip -->
              <div
                v-if="selectedPoint !== null"
                class="graph-tooltip"
                :style="tooltipStyle"
              >
                <div class="tooltip-date">
                  {{ graphData[selectedPoint].label }}
                </div>
                <div class="tooltip-amount">
                  ${{ graphData[selectedPoint].value.toFixed(2) }}
                </div>
              </div>
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
                    <li
                      v-for="(suggestion, index) in aiSuggestions"
                      :key="index"
                      class="suggestion-item"
                    >
                      <span class="suggestion-bullet">→</span>
                      <span>{{ suggestion }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- End Exportable Section -->

        <!-- Recent Purchases -->
        <div class="card purchases-section">
          <h2 class="card-title">Recent Purchases</h2>
          <div v-if="isLoadingPurchases" class="loading-message">
            Loading purchases...
          </div>
          <div v-else-if="recentPurchases.length === 0" class="empty-message">
            No purchases yet
          </div>
          <div v-else class="purchases-list">
            <div
              v-for="purchase in recentPurchases"
              :key="purchase._id"
              class="purchase-item"
            >
              <div class="purchase-image">
                <img
                  v-if="purchase.photo"
                  :src="purchase.photo"
                  :alt="purchase.itemName"
                  class="purchase-photo"
                />
                <div v-else class="image-placeholder">IMG</div>
              </div>
              <div class="purchase-details">
                <p class="purchase-name">{{ purchase.itemName }}</p>
                <p class="purchase-price">
                  ${{
                    (
                      (purchase.actualPrice || purchase.price) *
                      (purchase.quantity || 1)
                    ).toFixed(2)
                  }}
                </p>
                <p class="purchase-date">
                  {{ formatPurchaseDate(purchase.PurchasedTime) }}
                </p>
              </div>
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
              <div class="poster-metric-value">
                ${{ totalSaved.toFixed(2) }}
              </div>
              <div class="poster-metric-label">Total Saved</div>
            </div>
            <div class="poster-metric-card">
              <div class="poster-metric-value">
                ${{ totalBought.toFixed(2) }}
              </div>
              <div class="poster-metric-label">Total Bought</div>
            </div>
          </div>

          <!-- Purchase Progress -->
          <div class="poster-graph-section">
            <div class="poster-section-title">
              Purchase Progress ({{
                viewMode === "day" ? "Daily View" : "Monthly View"
              }})
            </div>
            <div class="poster-graph-container">
              <div class="poster-graph-metric">
                ${{ currentGraphTotal.toFixed(2) }}
              </div>
              <div class="poster-graph-label">{{ dateRangeLabel }}</div>
              <svg
                class="poster-graph-svg"
                viewBox="0 0 400 120"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="posterGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style="stop-color: #8ba888; stop-opacity: 0.3"
                    />
                    <stop
                      offset="100%"
                      style="stop-color: #8ba888; stop-opacity: 0.05"
                    />
                  </linearGradient>
                </defs>
                <path
                  class="poster-graph-area"
                  :d="posterGraphAreaPath"
                  fill="url(#posterGradient)"
                />
                <path class="poster-graph-line" :d="posterGraphPath" />
              </svg>
            </div>
          </div>

          <!-- Behavioral Insight -->
          <div class="poster-insight-section">
            <div class="poster-section-title">Key Insight</div>
            <div class="poster-insight-content">
              <div class="poster-mascot">
                <img
                  src="../assets/pig_sprite.png"
                  alt="Pig mascot"
                  class="pig-icon"
                />
              </div>
              <div class="poster-insight-text">
                {{ aiTrendAlert }}
              </div>
            </div>
          </div>
        </div>

        <!-- Poster Footer -->
        <div class="poster-footer">
          <div class="poster-footer-text">
            Track your spending habits with BYEBUY
          </div>
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
          <img
            v-if="previewImage"
            :src="previewImage"
            alt="Stats Preview"
            class="preview-image"
          />
        </div>
        <div class="modal-footer">
          <button class="modal-button secondary" @click="closePreview">
            Cancel
          </button>
          <button class="modal-button primary" @click="downloadImage">
            <span class="download-icon">⬇</span>
            Download
          </button>
        </div>
      </div>
    </div>

    <FAQButton :faqs="statsFAQs" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";
import html2canvas from "html2canvas";
import Navbar from "../components/Navbar.vue";
import FAQButton from "../components/FAQButton.vue";

const router = useRouter();
const route = useRoute();
const { currentUser, getSession } = useAuth();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const statsFAQs = [
  {
    question: "What does Total Saved mean?",
    answer:
      "Total Saved shows the combined price of all items you added to PauseCart but decided not to purchase. This represents money you saved by taking time to reflect before buying.",
  },
  {
    question: "What does Total Bought mean?",
    answer:
      "Total Bought is the sum of prices for all items you marked as purchased. This tracks your actual spending on items from your PauseCart.",
  },
  {
    question: "What does Items Bought mean?",
    answer:
      "Items Bought is the count of items you've marked as purchased from your PauseCart. This metric helps you track how many considered purchases you actually made.",
  },
  {
    question: "What does Rejection Rate mean?",
    answer:
      "Rejection Rate shows the percentage of items your community rejected from all items you added to your PauseCart.",
  },
  {
    question: "What does Items Reviewed mean?",
    answer:
      "Items Reviewed shows how many items you've swiped on in your daily SwipeSense queue. This tracks your community participation in helping others make better decisions.",
  },
  {
    question: "What are AI Trend Alerts?",
    answer:
      "AI analyzes your spending patterns and provides personalized insights to help you identify trends, avoid impulsive purchases, and make more mindful buying decisions.",
  },
  {
    question: "How do I export my stats?",
    answer:
      "Click the 'Export' button to download a visual summary of your stats that you can save or share. This helps you track your progress over time.",
  },
];

const exportSection = ref(null);
const posterTemplate = ref(null);
const showPreviewModal = ref(false);
const previewImage = ref(null);

// AI Insights
const aiTrendAlert = ref(
  "Oink oink! Your pause cart is empty. Start adding items you're considering buying to get personalized insights!"
);
const aiSuggestions = ref([
  "Add items to your pause cart that you're thinking about purchasing",
  "Take time to reflect on each item using our guided questions",
  "Use the AI insight feature to get personalized shopping advice",
  "Check back here after adding items to see your shopping patterns",
]);
const isLoadingInsights = ref(false);

// User name
const userName = computed(() => {
  if (currentUser?.value?.email) {
    const emailName = currentUser.value.email.split("@")[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  return "Alex"; // Fallback
});

// Recent purchases
const recentPurchases = ref([]);
const isLoadingPurchases = ref(false);

// Stats
const totalSaved = ref(0);
const totalBought = ref(0);
const itemsBought = ref(0);
const rejectionRate = ref(0);
const itemsReviewed = ref(0);

// Tooltip state
const hoveredStat = ref(null);

// Cached graph totals (separate for daily and monthly views)
const cachedGraphTotalDaily = ref(0);
const cachedGraphTotalMonthly = ref(0);
// Current graph total (will be updated when data loads)
const currentGraphTotalValue = ref(0);

// Cache key for stats
const STATS_CACHE_KEY = "stats_cache";
const VIEW_MODE_CACHE_KEY = "stats_view_mode";
const AI_INSIGHTS_CACHE_KEY = "ai_insights_cache";

// Load stats from cache
const loadStatsFromCache = () => {
  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY);
    if (cached) {
      const stats = JSON.parse(cached);
      totalSaved.value = stats.totalSaved ?? 0;
      totalBought.value = stats.totalBought ?? 0;
      itemsBought.value = stats.itemsBought ?? 0;
      rejectionRate.value = stats.rejectionRate ?? 0;
      itemsReviewed.value = stats.itemsReviewed ?? 0;
      cachedGraphTotalDaily.value = stats.cachedGraphTotalDaily ?? 0;
      cachedGraphTotalMonthly.value = stats.cachedGraphTotalMonthly ?? 0;
      // Initialize current graph total from cache based on current view mode
      currentGraphTotalValue.value =
        viewMode.value === "day"
          ? cachedGraphTotalDaily.value
          : cachedGraphTotalMonthly.value;
      console.log("Loaded stats from cache:", stats);
    }
  } catch (error) {
    console.error("Error loading stats from cache:", error);
  }
};

// Save stats to cache
const saveStatsToCache = () => {
  try {
    const stats = {
      totalSaved: totalSaved.value,
      totalBought: totalBought.value,
      itemsBought: itemsBought.value,
      rejectionRate: rejectionRate.value,
      itemsReviewed: itemsReviewed.value,
      cachedGraphTotalDaily: cachedGraphTotalDaily.value,
      cachedGraphTotalMonthly: cachedGraphTotalMonthly.value,
    };
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats));
    console.log("Saved stats to cache:", stats);
  } catch (error) {
    console.error("Error saving stats to cache:", error);
  }
};

// Load AI insights from cache
const loadAIInsightsFromCache = () => {
  try {
    const cached = localStorage.getItem(AI_INSIGHTS_CACHE_KEY);
    if (cached) {
      const insights = JSON.parse(cached);
      if (insights.aiTrendAlert) {
        aiTrendAlert.value = insights.aiTrendAlert;
      }
      if (insights.aiSuggestions && Array.isArray(insights.aiSuggestions)) {
        aiSuggestions.value = insights.aiSuggestions;
      }
      console.log("Loaded AI insights from cache:", insights);
    }
  } catch (error) {
    console.error("Error loading AI insights from cache:", error);
  }
};

// Save AI insights to cache
const saveAIInsightsToCache = () => {
  try {
    const insights = {
      aiTrendAlert: aiTrendAlert.value,
      aiSuggestions: aiSuggestions.value,
    };
    localStorage.setItem(AI_INSIGHTS_CACHE_KEY, JSON.stringify(insights));
    console.log("Saved AI insights to cache:", insights);
  } catch (error) {
    console.error("Error saving AI insights to cache:", error);
  }
};

// Graph state
// Load view mode from cache, default to 'day' if not found
const loadViewModeFromCache = () => {
  try {
    const cached = localStorage.getItem(VIEW_MODE_CACHE_KEY);
    if (cached && (cached === "day" || cached === "month")) {
      return cached;
    }
  } catch (error) {
    console.error("Error loading view mode from cache:", error);
  }
  return "day"; // Default to 'day'
};

const viewMode = ref(loadViewModeFromCache()); // 'day' or 'month'
const offset = ref(0); // Offset for navigation (0 = most recent)
const selectedPoint = ref(null);
const graphData = ref([]);
const touchStartX = ref(0);

// Save view mode to cache
const saveViewModeToCache = () => {
  try {
    localStorage.setItem(VIEW_MODE_CACHE_KEY, viewMode.value);
    console.log("Saved view mode to cache:", viewMode.value);
  } catch (error) {
    console.error("Error saving view mode to cache:", error);
  }
};

const currentDate = computed(() => {
  const date = new Date();
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Fetch AI insights based on wishlist data only (no swipe data)
const fetchAIInsights = async () => {
  if (!currentUser?.value?.uid) {
    console.log("No current user, skipping AI insights");
    return;
  }

  console.log("Stats: fetchAIInsights called with user:", currentUser.value);
  console.log("Stats: Fetching wishlist for uid:", currentUser.value.uid);

  isLoadingInsights.value = true;
  const session = getSession();
  try {
    // Get session token for authentication
    const session = getSession();
    if (!session) {
      console.error("No session token available");
      throw new Error("Authentication required. Please log in again.");
    }

    // Get AI response (backend will fetch wishlist and build prompt internally)
    const response = await fetch(
      `${API_BASE_URL}/ItemCollection/getAIWishListInsight`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const responseText = data.llm_response;

    if (!responseText) {
      console.error("No AI response received");
      return;
    }

    // 5. Parse JSON response and display
    // Note: Backend uses structured output, so response is guaranteed to be valid JSON
    try {
      const parsed = JSON.parse(responseText.trim());
      if (parsed.trendAlert && parsed.improvementSuggestions) {
        aiTrendAlert.value = parsed.trendAlert;
        aiSuggestions.value = parsed.improvementSuggestions;
        // Save to cache after successful fetch
        saveAIInsightsToCache();
      } else {
        console.error("Invalid AI response format:", parsed);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw response:", response);
    }
  } catch (error) {
    console.error("Error fetching AI insights:", error);
  } finally {
    isLoadingInsights.value = false;
  }
};

// Fetch purchased items
const fetchPurchasedItems = async () => {
  if (!currentUser?.value?.uid) {
    console.log("No current user, skipping purchased items fetch");
    return;
  }

  isLoadingPurchases.value = true;
  const session = getSession();
  try {
    // Get session token for authentication
    const session = getSession();
    if (!session) {
      console.error("No session token available for fetching purchases");
      recentPurchases.value = [];
      isLoadingPurchases.value = false;
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/ItemCollection/_getPurchasedItems`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session }),
      }
    );

    const data = await response.json();

    console.log("Purchased items response:", data);

    if (data.error) {
      console.log("Error fetching purchased items:", data.error);
      recentPurchases.value = [];
    } else if (data.items && Array.isArray(data.items)) {
      // Data comes back as { items: [{ item: {...} }] } from the sync
      // Unwrap the nested item structure
      const unwrappedItems = data.items.map((obj) => obj.item || obj);
      console.log("Unwrapped purchased items:", unwrappedItems);

      // Sort by purchase date (most recent first)
      const items = unwrappedItems.sort((a, b) => {
        return (b.PurchasedTime || 0) - (a.PurchasedTime || 0);
      });
      recentPurchases.value = items;
    } else {
      recentPurchases.value = [];
    }
  } catch (error) {
    console.error("Error fetching purchased items:", error);
    recentPurchases.value = [];
  } finally {
    isLoadingPurchases.value = false;
  }
};

// Format purchase date
const formatPurchaseDate = (timestamp) => {
  if (!timestamp) return "Unknown date";

  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
};

// Calculate stats
const calculateStats = async () => {
  if (!currentUser?.value?.uid) {
    console.log("No current user, skipping stats calculation");
    return;
  }

  const session = getSession();
  try {
    // Get session token for authentication
    const session = getSession();
    if (!session) {
      console.error("No session token available for calculateStats");
      return;
    }

    // 1. Fetch all items for this user
    const wishlistResponse = await fetch(
      `${API_BASE_URL}/ItemCollection/_getWishListItems`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session }),
      }
    );

    const wishlistData = await wishlistResponse.json();

    if (wishlistData.error) {
      console.log("Error fetching wishlist for stats:", wishlistData.error);
      return;
    }

    // Data comes back as { items: [...] } from the sync
    // Each element is { item: {...} }, so we need to unwrap
    const allItems = (wishlistData.items || []).map((obj) => obj.item || obj);
    console.log("calculateStats: allItems:", allItems);
    console.log("calculateStats: allItems length:", allItems.length);

    // 2. Calculate total saved (sum of prices of unpurchased items)
    const unpurchasedItems = allItems.filter((item) => !item.wasPurchased);
    console.log("calculateStats: unpurchasedItems:", unpurchasedItems);
    console.log(
      "calculateStats: unpurchasedItems prices:",
      unpurchasedItems.map((i) => ({
        name: i.itemName,
        price: i.price,
        wasPurchased: i.wasPurchased,
      }))
    );

    totalSaved.value = unpurchasedItems.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );
    console.log("calculateStats: totalSaved:", totalSaved.value);

    // 3. Calculate total bought and items bought
    const purchasedItems = allItems.filter((item) => item.wasPurchased);
    itemsBought.value = purchasedItems.length;
    totalBought.value = purchasedItems.reduce((sum, item) => {
      const price = item.actualPrice || item.price || 0;
      const quantity = item.quantity || 1;
      return sum + price * quantity;
    }, 0);

    // 4. Fetch items reviewed from SwipeSystem
    try {
      console.log("Fetching items reviewed with session:", session);
      const reviewsResponse = await fetch(
        `${API_BASE_URL}/SwipeSystem/_getUserSwipeCount`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session }),
        }
      );

      const reviewsData = await reviewsResponse.json();
      console.log("Items reviewed response:", reviewsData);

      if (reviewsData.error) {
        console.log("Error fetching items reviewed:", reviewsData.error);
        itemsReviewed.value = 0;
      } else {
        // Response might be an array (if Query) or object - handle both
        let reviewCount = 0;
        if (Array.isArray(reviewsData)) {
          reviewCount =
            reviewsData[0]?.count || reviewsData[0]?.totalReviews || 0;
        } else {
          reviewCount = reviewsData.count || reviewsData.totalReviews || 0;
        }
        console.log("Setting items reviewed to:", reviewCount);
        itemsReviewed.value = reviewCount;
      }
    } catch (error) {
      console.error("Error fetching items reviewed:", error);
      itemsReviewed.value = 0;
    }

    // 5. Rejection rate - set to 0 (swipe system removed)
    rejectionRate.value = 0;

    // Save stats to cache after calculation
    saveStatsToCache();
  } catch (error) {
    console.error("Error calculating stats:", error);
    // Still save current stats to cache even on error
    saveStatsToCache();
  }
};

// Calculate the actual total for the time period (past 7 days for daily, past month for monthly)
const calculateGraphTotal = () => {
  const now = new Date();

  if (viewMode.value === "day") {
    // Calculate total for past 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const total = recentPurchases.value
      .filter((item) => {
        const purchaseDate = new Date(item.PurchasedTime);
        return purchaseDate >= sevenDaysAgo;
      })
      .reduce((sum, item) => {
        const price = item.actualPrice || item.price || 0;
        const quantity = item.quantity || 1;
        return sum + price * quantity;
      }, 0);

    cachedGraphTotalDaily.value = total;
    currentGraphTotalValue.value = total;
    saveStatsToCache();
  } else {
    // Calculate total for past month
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    const total = recentPurchases.value
      .filter((item) => {
        const purchaseDate = new Date(item.PurchasedTime);
        return purchaseDate >= oneMonthAgo;
      })
      .reduce((sum, item) => {
        const price = item.actualPrice || item.price || 0;
        const quantity = item.quantity || 1;
        return sum + price * quantity;
      }, 0);

    cachedGraphTotalMonthly.value = total;
    currentGraphTotalValue.value = total;
    saveStatsToCache();
  }
};

// Graph helper functions
const processGraphData = () => {
  const numPeriods = 7;
  const data = [];
  const now = new Date();

  if (viewMode.value === "day") {
    // Generate last 7 days
    for (let i = numPeriods - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i - offset.value * numPeriods);
      const dateStr = date.toISOString().split("T")[0];

      // Sum purchases on this day
      const value = recentPurchases.value
        .filter((item) => {
          const purchaseDate = new Date(item.PurchasedTime);
          return purchaseDate.toISOString().split("T")[0] === dateStr;
        })
        .reduce((sum, item) => {
          const price = item.actualPrice || item.price || 0;
          const quantity = item.quantity || 1;
          return sum + price * quantity;
        }, 0);

      data.push({
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value,
        date: dateStr,
      });
    }
  } else {
    // Generate last 7 months
    for (let i = numPeriods - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i - offset.value * numPeriods);
      const monthStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      // Sum purchases in this month
      const value = recentPurchases.value
        .filter((item) => {
          const purchaseDate = new Date(item.PurchasedTime);
          const purchaseMonth = `${purchaseDate.getFullYear()}-${String(
            purchaseDate.getMonth() + 1
          ).padStart(2, "0")}`;
          return purchaseMonth === monthStr;
        })
        .reduce((sum, item) => {
          const price = item.actualPrice || item.price || 0;
          const quantity = item.quantity || 1;
          return sum + price * quantity;
        }, 0);

      data.push({
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        value,
        date: monthStr,
      });
    }
  }

  graphData.value = data;
};

// Computed properties for graph
const currentGraphTotal = computed(() => {
  return currentGraphTotalValue.value;
});

const dateRangeLabel = computed(() => {
  if (graphData.value.length === 0) return "";
  return `${graphData.value[0].label} - ${
    graphData.value[graphData.value.length - 1].label
  }`;
});

const graphPoints = computed(() => {
  const maxValue = Math.max(...graphData.value.map((d) => d.value), 1);
  const width = 500;
  const height = 280;
  const padding = 20;

  return graphData.value.map((point, index) => {
    const x = (index / (graphData.value.length - 1)) * width;
    const y =
      height - padding - (point.value / maxValue) * (height - padding * 2);
    return { x, y };
  });
});

const graphPath = computed(() => {
  if (graphPoints.value.length === 0) return "";

  const points = graphPoints.value;
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  return path;
});

const graphAreaPath = computed(() => {
  if (graphPoints.value.length === 0) return "";

  const points = graphPoints.value;
  let path = `M ${points[0].x} 280 L ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  path += ` L ${points[points.length - 1].x} 280 Z`;
  return path;
});

const xAxisLabels = computed(() => {
  const width = 500;

  return graphData.value.map((point, index) => {
    let text;
    if (viewMode.value === "day") {
      // Format as MM/DD (e.g., "11/30", "12/1")
      const date = new Date(point.date + "T00:00:00");
      const month = date.getMonth() + 1;
      const day = date.getDate();
      text = `${month}/${day}`;
    } else {
      // For monthly view, use the month abbreviation
      text = point.label.split(" ")[0];
    }

    // Keep centered alignment but position labels within safe bounds
    const x = (index / (graphData.value.length - 1)) * width;

    return {
      x: x,
      text: text,
    };
  });
});

const yAxisLabels = computed(() => {
  const maxValue = Math.max(...graphData.value.map((d) => d.value), 1);
  const height = 280;
  const padding = 20;
  const chartHeight = height - padding * 2;

  // Calculate nice round numbers for Y-axis ticks
  const niceMax = Math.ceil(maxValue / 10) * 10 || 10;
  const numTicks = 4;
  const tickStep = niceMax / numTicks;

  const labels = [];
  for (let i = 0; i <= numTicks; i++) {
    const value = niceMax - i * tickStep;
    // Calculate y position matching graphPoints calculation
    const y = height - padding - (value / niceMax) * chartHeight;
    // Convert to percentage from top for CSS positioning
    const position = (y / height) * 100;
    labels.push({
      value: value.toFixed(0),
      y: y,
      position: position,
    });
  }

  return labels;
});

const tooltipStyle = computed(() => {
  if (selectedPoint.value === null || !graphPoints.value[selectedPoint.value])
    return {};

  const point = graphPoints.value[selectedPoint.value];
  return {
    left: `${point.x}px`,
    top: `${point.y - 50}px`,
  };
});

// Poster graph computed properties (for export with different dimensions)
const posterGraphPoints = computed(() => {
  const maxValue = Math.max(...graphData.value.map((d) => d.value), 1);
  const width = 400;
  const height = 120;
  const padding = 10;

  return graphData.value.map((point, index) => {
    const x = (index / (graphData.value.length - 1)) * width;
    const y =
      height - padding - (point.value / maxValue) * (height - padding * 2);
    return { x, y };
  });
});

const posterGraphPath = computed(() => {
  if (posterGraphPoints.value.length === 0) return "";

  const points = posterGraphPoints.value;
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  return path;
});

const posterGraphAreaPath = computed(() => {
  if (posterGraphPoints.value.length === 0) return "";

  const points = posterGraphPoints.value;
  let path = `M ${points[0].x} 120 L ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  path += ` L ${points[points.length - 1].x} 120 Z`;
  return path;
});

// Graph interaction functions
const selectPoint = (index) => {
  selectedPoint.value = index;
};

const navigateGraph = (direction) => {
  offset.value = Math.max(0, offset.value + direction);
  processGraphData();
  selectedPoint.value = null;
};

// Touch handlers for mobile swipe
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX;
};

const handleTouchMove = (e) => {
  // Optional: add visual feedback during drag
};

const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchStartX.value - touchEndX;

  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      // Swipe left - go back in time
      navigateGraph(1);
    } else {
      // Swipe right - go forward in time
      navigateGraph(-1);
    }
  }
};

// Watch for changes to update graph
watch(viewMode, () => {
  offset.value = 0;
  selectedPoint.value = null;
  // Save view mode to cache
  saveViewModeToCache();
  // Update current graph total from cache for the new view mode
  currentGraphTotalValue.value =
    viewMode.value === "day"
      ? cachedGraphTotalDaily.value
      : cachedGraphTotalMonthly.value;
  processGraphData();
  // Recalculate if we have purchases
  if (recentPurchases.value.length > 0) {
    calculateGraphTotal();
  }
});

// Watch for changes to recentPurchases to update graph total
watch(
  recentPurchases,
  () => {
    if (recentPurchases.value.length > 0) {
      processGraphData();
      calculateGraphTotal();
    }
  },
  { deep: true }
);

// Watch for route changes to recalculate stats when navigating to this page
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath === "/stats") {
      console.log(
        "Route changed to /stats, recalculating stats. Old path:",
        oldPath
      );
      calculateStats();
    }
  },
  { immediate: false }
);

// Fetch AI insights on component mount
onMounted(() => {
  // Load cached stats and AI insights first for immediate display
  loadStatsFromCache();
  loadAIInsightsFromCache();

  fetchAIInsights();
  fetchPurchasedItems().then(() => {
    processGraphData();
  });
  calculateStats();
});

// Also recalculate when component is activated (if using keep-alive)
onActivated(() => {
  console.log("Stats component activated, recalculating stats");
  // Load cached stats and AI insights first for immediate display
  loadStatsFromCache();
  loadAIInsightsFromCache();
  fetchPurchasedItems().then(() => {
    processGraphData();
  });
  calculateStats();
});

const exportStats = async () => {
  if (!posterTemplate.value) return;

  try {
    // Temporarily show the poster template
    posterTemplate.value.style.display = "block";

    // Small delay to ensure rendering
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Capture the poster as canvas
    const canvas = await html2canvas(posterTemplate.value, {
      backgroundColor: "#FEFEFE",
      scale: 3, // High quality for poster
      logging: false,
      useCORS: true,
      width: 1080,
      height: 1920,
    });

    // Hide the poster template again
    posterTemplate.value.style.display = "none";

    // Convert canvas to data URL for preview
    const imageDataUrl = canvas.toDataURL("image/png");
    previewImage.value = imageDataUrl;
    showPreviewModal.value = true;
  } catch (error) {
    console.error("Error generating stats poster:", error);
    alert("Failed to generate stats poster. Please try again.");
    if (posterTemplate.value) {
      posterTemplate.value.style.display = "none";
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
  const link = document.createElement("a");
  const fileName = `BYEBUY-Stats-${new Date().toISOString().split("T")[0]}.png`;
  link.download = fileName;
  link.href = previewImage.value;
  link.click();

  // Close modal after download
  closePreview();
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap");

.stats-container {
  /* Color Variables */
  --color-bg: #fefefe;
  --color-bg-secondary: #f8f8f6;
  --color-bg-tertiary: #f0f0ee;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #e0e0de;
  --color-border-dark: #333333;
  --color-accent-green: #8ba888;
  --color-accent-red: #d47b7b;
  --color-accent-pink: #e8b4b4;
  --font-primary: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif;

  /* Container Styles */
  min-height: 100vh;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-secondary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
  text-transform: uppercase;
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
  background: linear-gradient(
    135deg,
    var(--color-bg-tertiary) 0%,
    var(--color-bg-secondary) 100%
  );
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

.purchase-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
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

.purchase-price {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-accent-green);
}

.purchase-date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 2rem;
  font-size: 0.875rem;
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
  padding: 1.25rem 1.75rem 1.25rem 1.25rem;
  margin-bottom: 1rem;
}

.graph-wrapper {
  position: relative;
  display: flex;
  width: 100%;
  height: 300px;
}

.y-axis-labels {
  position: relative;
  width: 30px;
  height: 300px;
  flex-shrink: 0;
  padding-right: 0.125rem;
  z-index: 1;
}

.y-axis-label {
  position: absolute;
  font-size: 0.7rem;
  font-family: var(--font-primary);
  color: var(--color-text-tertiary);
  font-weight: 500;
  text-align: right;
  right: 0.125rem;
  transform: translateY(-50%);
}

.graph-svg {
  flex: 1;
  min-width: 500px;
  height: 300px;
  margin-left: 30px;
  overflow: visible;
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
  opacity: 0.3;
}

.axis-line {
  stroke: var(--color-border);
  stroke-width: 1.5;
  opacity: 0.6;
}

.graph-label {
  font-size: 0.75rem;
  fill: var(--color-text-tertiary);
  font-family: var(--font-secondary);
}

.graph-point {
  fill: var(--color-accent-green);
  stroke: var(--color-bg);
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s ease;
}

.graph-point:hover,
.graph-point.active {
  r: 7;
  fill: var(--color-text-primary);
}

.graph-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.graph-controls .card-title {
  margin-bottom: 0;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  background-color: var(--color-bg-secondary);
  border-radius: 6px;
  padding: 0.25rem;
}

.view-toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 500;
  background-color: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-toggle-btn:hover {
  color: var(--color-text-primary);
}

.view-toggle-btn.active {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-weight: 600;
}

.graph-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.25rem;
  background-color: var(--color-bg);
  border-radius: 8px;
}

.nav-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
}

.nav-btn:hover:not(:disabled) {
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  border-color: var(--color-text-primary);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-range {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  min-width: 200px;
  text-align: center;
}

.graph-tooltip {
  position: absolute;
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  pointer-events: none;
  transform: translateX(-50%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.tooltip-amount {
  font-family: var(--font-primary);
  font-size: 1rem;
  font-weight: 700;
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
  background: linear-gradient(
    135deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg) 100%
  );
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pig-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
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
  position: relative;
}

.stat-box:hover {
  border-color: var(--color-border-dark);
  transform: translateY(-2px);
}

.stat-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.4;
  white-space: nowrap;
  max-width: 250px;
  white-space: normal;
  text-align: center;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

.stat-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--color-text-primary);
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

  .stats-content {
    padding: 3rem 2rem;
  }
}

@media (max-width: 768px) {
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

  .stat-tooltip {
    max-width: 200px;
    font-size: 0.7rem;
    padding: 0.625rem 0.875rem;
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
  background: linear-gradient(135deg, #fefefe 0%, #f8f8f6 100%);
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
  background: linear-gradient(
    135deg,
    var(--color-accent-green) 0%,
    #7a9877 100%
  );
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
  background: linear-gradient(
    135deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg) 100%
  );
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
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.poster-mascot .pig-icon {
  width: 96px;
  height: 96px;
  object-fit: contain;
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
