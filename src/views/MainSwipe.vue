<template>
  <div
    class="swipe-container"
    :class="{ 'swiping-left': isSwipingLeft, 'swiping-right': isSwipingRight }"
  >
    <!-- Color expansion overlay -->
    <div
      class="color-overlay"
      :class="{
        'expand-red': isSwipingLeft,
        'expand-green': isSwipingRight,
        dragging: isDragging,
      }"
      :style="overlayStyle"
    ></div>

    <Navbar />

    <div class="progress-bar-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :class="{ full: progressPercentage >= 100 }"
          :style="{ width: `calc(${progressPercentage}% - 4px)` }"
        ></div>
      </div>
      <div class="progress-text">{{ completedSwipes }} / {{ totalSwipes }}</div>
    </div>

    <div class="card-container" ref="cardContainer">
      <!-- Swipe hint arrows -->
      <Transition name="hint-fade">
        <div v-if="showSwipeHint && currentItem" class="swipe-hint-container">
          <div class="swipe-hint-arrow left-arrow">←</div>
          <div class="swipe-hint-arrow right-arrow">→</div>
        </div>
      </Transition>

      <div
        class="swipe-card"
        v-if="currentItem"
        :class="{
          'swipe-left': swipeDirection === 'left',
          'swipe-right': swipeDirection === 'right',
          dragging: isDragging,
        }"
        :style="cardStyle"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseEnd"
        @mouseleave="handleMouseEnd"
      >
        <div class="card-image">
          <img
            v-if="currentItem.photo"
            :src="currentItem.photo"
            :alt="currentItem.itemName"
            class="item-photo"
            draggable="false"
          />
          <img
            v-else
            src="../assets/pig_sprite.png"
            alt="Item placeholder"
            class="item-photo placeholder"
            draggable="false"
          />
        </div>
        <div class="card-content">
          <div class="user-info">
            <img
              src="../assets/pig_pfp.png"
              alt="User profile"
              class="user-pfp"
            />
            <span class="user-name">{{ currentItem.ownerName || "User" }}</span>
          </div>
          <h2 class="item-name">{{ currentItem.itemName }}</h2>
          <p class="item-desc">{{ currentItem.description }}</p>
          <p class="item-price">${{ currentItem.price.toFixed(2) }}</p>

          <div class="reflection-section">
            <h3 class="reflection-title">Reflection</h3>
            <div class="reflection-item">
              <strong>Why do they want this?</strong>
              <p>{{ currentItem.reason }}</p>
            </div>
            <div class="reflection-item">
              <strong>Is this a need or a want?</strong>
              <p>{{ currentItem.isNeed }}</p>
            </div>
            <div class="reflection-item">
              <strong>Would Future-Them approve?</strong>
              <p>{{ currentItem.isFutureApprove }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="hasCompletedQueue" class="finished-message">
        <p>You've finished your queue for today!</p>
        <p class="anti-capitalist">🎉</p>
      </div>
      <div v-else-if="hasLoadTimeout" class="timeout-message">
        <p>Queue loading timed out.</p>
        <p class="timeout-subtitle">Please logout and try again.</p>
        <button class="logout-retry-button" @click="handleLogoutAndRetry">
          Logout and Retry
        </button>
      </div>
      <div v-else class="loading-message">
        <p>Generating queue for you...</p>
        <div class="loading-spinner"></div>
      </div>
    </div>

    <div class="swipe-actions" v-if="currentItem">
      <button class="skip-button" @click="handleSkip" :disabled="isAnimating">
        SKIP IT
      </button>
      <button
        class="worth-button"
        @click="handleWorthIt"
        :disabled="isAnimating"
      >
        WORTH IT
      </button>
    </div>

    <FAQButton :faqs="swipeFAQs" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useColors } from "../composables/useColors";
import { useAuth } from "../composables/useAuth";
import Navbar from "../components/Navbar.vue";
import FAQButton from "../components/FAQButton.vue";

const router = useRouter();
const { palette } = useColors();
const { currentUser, getSession, logout } = useAuth();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const swipeFAQs = [
  {
    question: "What is SwipeSense?",
    answer:
      "SwipeSense helps you make mindful purchasing decisions by swiping through items others are considering. Swipe right (Worth It) if you think they should buy it, left (Skip It) if not.",
  },
  {
    question: "How does the daily queue work?",
    answer:
      "Every day you get a queue of 10 items to review. Each item includes reflections from the person who added it. Complete your queue to help others make better decisions!",
  },
  {
    question: "What happens when I swipe?",
    answer:
      "Your swipes help others see different perspectives on their potential purchases. Swipe right if you think it's worth buying, left if they should skip it.",
  },
  {
    question: "How to interact with this page?",
    answer:
      "You can either drag and swipe the items, or click the buttons to log your decisions.",
  },
];

const totalSwipes = ref(10);
const completedSwipes = ref(0);
const currentItemIndex = ref(0);
const swipeDirection = ref(null);
const isAnimating = ref(false);
const isSwipingLeft = ref(false);
const isSwipingRight = ref(false);
const isLoading = ref(false);
const hasLoadTimeout = ref(false);

// Drag/swipe state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragCurrentX = ref(0);
const dragOffset = ref(0);

const queueItems = ref([]);
const hasCompletedQueue = ref(false);

// Inactivity hint animation
const showSwipeHint = ref(false);
let inactivityTimer = null;

// Cache key for completed queue status (includes session to prevent cross-user cache)
const COMPLETED_QUEUE_CACHE_KEY = "completed_queue_status";
const COMPLETED_QUEUE_SESSION_KEY = "completed_queue_session";

// Load completed queue status from cache (only if session matches)
const loadCompletedQueueFromCache = () => {
  try {
    const session = getSession();
    if (!session) {
      // No session, clear any cached data
      localStorage.removeItem(COMPLETED_QUEUE_CACHE_KEY);
      localStorage.removeItem(COMPLETED_QUEUE_SESSION_KEY);
      return;
    }

    const cachedSession = localStorage.getItem(COMPLETED_QUEUE_SESSION_KEY);
    const cached = localStorage.getItem(COMPLETED_QUEUE_CACHE_KEY);

    // Only use cache if session matches
    if (cached !== null && cachedSession === session) {
      hasCompletedQueue.value = cached === "true";
      console.log(
        "Loaded completed queue status from cache:",
        hasCompletedQueue.value
      );
    } else {
      // Session mismatch or no cache, clear it
      if (cachedSession && cachedSession !== session) {
        console.log("Session changed, clearing completed queue cache");
        localStorage.removeItem(COMPLETED_QUEUE_CACHE_KEY);
        localStorage.removeItem(COMPLETED_QUEUE_SESSION_KEY);
      }
      hasCompletedQueue.value = false;
    }
  } catch (error) {
    console.error("Error loading completed queue status from cache:", error);
    hasCompletedQueue.value = false;
  }
};

// Save completed queue status to cache (with session)
const saveCompletedQueueToCache = (completed) => {
  try {
    const session = getSession();
    if (!session) {
      // No session, don't cache
      return;
    }

    localStorage.setItem(COMPLETED_QUEUE_CACHE_KEY, completed.toString());
    localStorage.setItem(COMPLETED_QUEUE_SESSION_KEY, session);
    console.log("Saved completed queue status to cache:", completed);
  } catch (error) {
    console.error("Error saving completed queue status to cache:", error);
  }
};

const currentItem = computed(() => {
  if (currentItemIndex.value < queueItems.value.length) {
    return queueItems.value[currentItemIndex.value];
  }
  return null;
});

const progressPercentage = computed(() => {
  return (completedSwipes.value / totalSwipes.value) * 100;
});

// Helper function to create timeout promise
const createTimeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), ms);
  });
};

// Load or generate today's queue
const loadQueue = async () => {
  const session = getSession();
  if (!session) {
    console.log("No session - user not logged in");
    return;
  }

  // Set loading state immediately to show loading message
  isLoading.value = true;
  hasLoadTimeout.value = false;

  // Load cached completed status first
  loadCompletedQueueFromCache();

  // If cached as completed, show finished message immediately
  if (hasCompletedQueue.value) {
    queueItems.value = [];
    isLoading.value = false;
    return;
  }

  try {
    // Wrap the entire queue loading process with a 15-second timeout
    await Promise.race([loadQueueWithTimeout(session), createTimeout(15000)]);
  } catch (error) {
    if (error.message === "Request timeout") {
      console.error("Queue loading timed out");
      hasLoadTimeout.value = true;
    } else {
      console.error("Error loading queue:", error);
    }
  } finally {
    isLoading.value = false;
  }
};

const loadQueueWithTimeout = async (session) => {
  try {
    // First, try to get today's queue
    const queueResponse = await fetch(
      `${API_BASE_URL}/QueueSystem/_getTodayQueue`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session }),
      }
    );

    const queueData = await queueResponse.json();

    let itemIds = [];
    let completed = 0;

    // Check if queue is completed (empty itemIdSet but has completedQueue)
    if (
      !queueData.error &&
      queueData.completedQueue > 0 &&
      (!queueData.itemIdSet || queueData.itemIdSet.length === 0)
    ) {
      // Queue exists but all items have been completed
      console.log("Today's queue is complete! All items have been swiped.");
      queueItems.value = [];
      completedSwipes.value = queueData.completedQueue;
      totalSwipes.value = queueData.completedQueue;
      hasCompletedQueue.value = true;
      saveCompletedQueueToCache(true);
      return;
    }

    if (
      queueData.error ||
      !queueData.itemIdSet ||
      queueData.itemIdSet.length === 0
    ) {
      // No queue exists for today, generate one
      console.log("No queue found, generating new queue...");

      // Get 10 random items (requires session to exclude user's own items)
      const randomItemsResponse = await fetch(
        `${API_BASE_URL}/ItemCollection/_getTenRandomItems`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session }),
        }
      );

      const randomItemsData = await randomItemsResponse.json();

      if (
        randomItemsData.error ||
        !randomItemsData.itemIdSet ||
        randomItemsData.itemIdSet.length === 0
      ) {
        console.error("Failed to get random items:", randomItemsData.error);
        return;
      }

      itemIds = randomItemsData.itemIdSet;

      // Generate daily queue
      const generateResponse = await fetch(
        `${API_BASE_URL}/QueueSystem/generateDailyQueue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session, itemIds }),
        }
      );

      const generateData = await generateResponse.json();

      if (generateData.error) {
        // If queue already exists, retry loading it
        if (generateData.error.includes("already exists")) {
          console.log("Queue already exists, loading existing queue...");
          const retryQueueResponse = await fetch(
            `${API_BASE_URL}/QueueSystem/_getTodayQueue`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ session }),
            }
          );
          const retryQueueData = await retryQueueResponse.json();
          if (retryQueueData.itemIdSet && retryQueueData.itemIdSet.length > 0) {
            itemIds = retryQueueData.itemIdSet;
            completed = retryQueueData.completedQueue;
          } else {
            console.error("Failed to load existing queue");
            return;
          }
        } else {
          console.error("Failed to generate queue:", generateData.error);
          return;
        }
      } else {
        completed = 0;
      }
    } else {
      // Queue exists, load unrated items
      itemIds = queueData.itemIdSet;
      completed = queueData.completedQueue;
    }

    completedSwipes.value = completed;

    // Fetch full item details for each itemId (using session for authenticated route)
    const itemDetailsPromises = itemIds.map((itemId) =>
      fetch(`${API_BASE_URL}/ItemCollection/_getItemDetails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session, itemId }),
      }).then((res) => res.json())
    );

    const itemDetailsResponses = await Promise.all(itemDetailsPromises);

    // Extract items from responses
    // Handle both array format [{ item }] and object format { item }
    const items = itemDetailsResponses
      .filter((response) => !response.error)
      .map((response) => {
        // If response is array (from concept directly), get first element
        if (Array.isArray(response) && response.length > 0) {
          return response[0].item;
        }
        // If response is object with item property (from sync)
        if (response.item) {
          return response.item;
        }
        return null;
      })
      .filter((item) => item !== null);

    queueItems.value = items;

    // If we successfully loaded items, queue is not completed
    if (items.length > 0) {
      hasCompletedQueue.value = false;
      saveCompletedQueueToCache(false);
    }
  } catch (error) {
    console.error("Error in loadQueueWithTimeout:", error);
    throw error;
  }
};

const handleLogoutAndRetry = async () => {
  await logout();
  router.push("/login");
};

// Inactivity hint functions
const startInactivityTimer = () => {
  clearInactivityTimer();
  if (currentItem.value && !isAnimating.value) {
    inactivityTimer = setTimeout(() => {
      showSwipeHint.value = true;
    }, 5000);
  }
};

const clearInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  showSwipeHint.value = false;
};

const resetInactivityTimer = () => {
  clearInactivityTimer();
  startInactivityTimer();
};

const cardStyle = computed(() => {
  if (isDragging.value) {
    return {
      transform: `translateX(${dragOffset.value}px) rotate(${
        dragOffset.value * 0.1
      }deg)`,
      opacity: 1 - Math.abs(dragOffset.value) / 500,
    };
  }
  return {};
});

const overlayStyle = computed(() => {
  // Always calculate based on dragOffset when dragging (so it shrinks/expands smoothly)
  if (isDragging.value) {
    // Calculate size based on drag distance (more subtle, max at 300px drag)
    const maxDrag = 300;
    const dragMagnitude = Math.min(Math.abs(dragOffset.value), maxDrag);
    const size = (dragMagnitude / maxDrag) * 150; // Max size of 150vmax for subtlety

    // Lower opacity for subtlety - max 0.25
    const opacity = Math.min((dragMagnitude / maxDrag) * 0.25, 0.25);

    return {
      width: `${size}vmax`,
      height: `${size}vmax`,
      opacity: `${opacity}`,
    };
  }

  // Full expansion on button click or card swipe
  if (isSwipingLeft.value || isSwipingRight.value) {
    return {
      width: "200vmax",
      height: "200vmax",
      opacity: "0.25",
    };
  }

  // Default: hidden
  return {
    width: "0",
    height: "0",
    opacity: "0",
  };
});

const performSwipe = async (direction) => {
  if (isAnimating.value || !currentItem.value) return;

  isAnimating.value = true;
  swipeDirection.value = direction;

  const item = currentItem.value;
  const decision = direction === "right" ? "Buy" : "Don't Buy";
  const session = getSession();

  // Fire-and-forget: Don't wait for API calls - animate immediately for smooth UX
  // Both calls happen in parallel in the background
  Promise.all([
    fetch(`${API_BASE_URL}/SwipeSystem/recordSwipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, itemId: item._id, decision }),
    }),
    fetch(`${API_BASE_URL}/QueueSystem/incrementCompletedQueue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, itemId: item._id }),
    }),
  ]).catch((error) => console.error("Error recording swipe:", error));

  // Cap animation speed - minimum 600ms to allow color expansion to animate smoothly
  setTimeout(() => {
    completedSwipes.value++;
    currentItemIndex.value++;

    // Check if queue is completed after this swipe
    if (currentItemIndex.value >= queueItems.value.length) {
      hasCompletedQueue.value = true;
      saveCompletedQueueToCache(true);
      clearInactivityTimer();
    } else {
      // Start inactivity timer for next card
      startInactivityTimer();
    }

    swipeDirection.value = null;
    isSwipingLeft.value = false;
    isSwipingRight.value = false;
    isAnimating.value = false;
    dragOffset.value = 0;
  }, 600);
};

const handleSkip = () => {
  resetInactivityTimer();
  // Full color expansion on button click
  isSwipingLeft.value = true;
  isSwipingRight.value = false;
  setTimeout(() => {
    isSwipingLeft.value = false;
  }, 600); // Match the swipe animation duration
  performSwipe("left");
};

const handleWorthIt = () => {
  resetInactivityTimer();
  // Full color expansion on button click
  isSwipingRight.value = true;
  isSwipingLeft.value = false;
  setTimeout(() => {
    isSwipingRight.value = false;
  }, 600); // Match the swipe animation duration
  performSwipe("right");
};

// Touch handlers
const handleTouchStart = (e) => {
  if (isAnimating.value) return;
  resetInactivityTimer();
  isDragging.value = true;
  dragStartX.value = e.touches[0].clientX;
  dragCurrentX.value = dragStartX.value;
};

const handleTouchMove = (e) => {
  if (!isDragging.value || isAnimating.value) return;
  dragCurrentX.value = e.touches[0].clientX;
  dragOffset.value = dragCurrentX.value - dragStartX.value;

  // Update color expansion based on drag direction (smooth threshold)
  if (dragOffset.value < -30) {
    isSwipingLeft.value = true;
    isSwipingRight.value = false;
  } else if (dragOffset.value > 30) {
    isSwipingRight.value = true;
    isSwipingLeft.value = false;
  } else {
    isSwipingLeft.value = false;
    isSwipingRight.value = false;
  }
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;

  const threshold = 100;
  if (dragOffset.value < -threshold) {
    performSwipe("left");
  } else if (dragOffset.value > threshold) {
    performSwipe("right");
  } else {
    // Snap back
    dragOffset.value = 0;
    isSwipingLeft.value = false;
    isSwipingRight.value = false;
  }

  isDragging.value = false;
};

// Mouse handlers (for desktop)
const handleMouseDown = (e) => {
  if (isAnimating.value) return;
  resetInactivityTimer();
  isDragging.value = true;
  dragStartX.value = e.clientX;
  dragCurrentX.value = dragStartX.value;
};

const handleMouseMove = (e) => {
  if (!isDragging.value || isAnimating.value) return;
  dragCurrentX.value = e.clientX;
  dragOffset.value = dragCurrentX.value - dragStartX.value;

  // Update color expansion based on drag direction (smooth threshold)
  if (dragOffset.value < -30) {
    isSwipingLeft.value = true;
    isSwipingRight.value = false;
  } else if (dragOffset.value > 30) {
    isSwipingRight.value = true;
    isSwipingLeft.value = false;
  } else {
    isSwipingLeft.value = false;
    isSwipingRight.value = false;
  }
};

const handleMouseEnd = () => {
  if (!isDragging.value) return;

  const threshold = 100;
  if (dragOffset.value < -threshold) {
    performSwipe("left");
  } else if (dragOffset.value > threshold) {
    performSwipe("right");
  } else {
    // Snap back
    dragOffset.value = 0;
    isSwipingLeft.value = false;
    isSwipingRight.value = false;
  }

  isDragging.value = false;
};

onMounted(async () => {
  await loadQueue();
  // Start inactivity timer after queue is loaded if there's a current item
  if (currentItem.value) {
    startInactivityTimer();
  }
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap");

.swipe-container {
  --font-primary: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif;

  min-height: 100vh;
  background-color: var(--color-bg);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: visible;
  overflow-y: auto;
  color: var(--color-text-primary);
  font-family: var(--font-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Color expansion overlay */
.color-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 20;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    background-color 0.3s ease;
}

.color-overlay.dragging {
  transition: background-color 0.2s ease;
}

.color-overlay.expand-red {
  background-color: v-bind("palette.red");
}

.color-overlay.expand-green {
  background-color: v-bind("palette.green");
}

.progress-bar-container {
  padding: 1rem 2.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 10;
  background-color: var(--color-bg);
}

.progress-bar {
  flex: 1;
  height: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-bg);
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--color-text-primary);
  transition: width 0.3s ease;
  border-radius: 8px;
}

.progress-fill.full {
  border-radius: 8px;
}

.progress-text {
  font-family: var(--font-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 60px;
  color: var(--color-text-primary);
}

.card-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 2.5rem;
  position: relative;
  z-index: 50;
  overflow: visible;
  box-sizing: border-box;
}

.swipe-hint-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 1000px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 40;
  padding: 0 1rem;
}

.swipe-hint-arrow {
  font-size: 2rem;
  color: var(--color-text-secondary);
  opacity: 0.6;
  animation: pulse 1.5s ease-in-out infinite;
}

.swipe-hint-arrow.left-arrow {
  animation: slideLeft 1.5s ease-in-out infinite;
}

.swipe-hint-arrow.right-arrow {
  animation: slideRight 1.5s ease-in-out infinite;
}

@keyframes slideLeft {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0.6;
  }
  50% {
    transform: translateX(-20px);
    opacity: 0.3;
  }
}

@keyframes slideRight {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0.6;
  }
  50% {
    transform: translateX(20px);
    opacity: 0.3;
  }
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.3s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

.swipe-card {
  max-width: 1000px;
  width: 100%;
  height: calc(100vh - 280px);
  min-height: 600px;
  max-height: calc(100vh - 280px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background-color: var(--color-bg);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  transition: transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease,
    border-color 0.3s ease;
  cursor: grab;
  user-select: none;
  touch-action: none;
  box-shadow: 0 2px 8px rgba(26, 26, 26, 0.04);
  position: relative;
  z-index: 100;
  box-sizing: border-box;
  margin: 1px;
  overflow: hidden;
}

.swipe-card:hover {
  border-color: var(--color-border-dark);
  box-shadow: 0 4px 20px rgba(26, 26, 26, 0.08);
}

.swipe-card:active {
  cursor: grabbing;
}

.swipe-card.dragging {
  transition: none;
}

.swipe-card.swipe-left {
  animation: swipeLeft 0.6s ease-out forwards;
}

.swipe-card.swipe-right {
  animation: swipeRight 0.6s ease-out forwards;
}

@keyframes swipeLeft {
  0% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateX(-1000px) rotate(-30deg);
    opacity: 0;
  }
}

@keyframes swipeRight {
  0% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateX(1000px) rotate(30deg);
    opacity: 0;
  }
}

.card-image {
  width: 45%;
  min-width: 300px;
  height: 100%;
  border-right: 1px solid var(--color-border);
  border-radius: 12px 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  overflow: hidden;
  flex-shrink: 0;
  align-self: stretch;
  position: relative;
}

.image-placeholder {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  font-family: var(--font-primary);
}

.item-photo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  /* Prevent image from being dragged */
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  pointer-events: none;
  display: block;
}

.item-photo.placeholder {
  object-fit: contain;
  padding: 2rem;
}

.card-content {
  padding: 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
  max-height: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.user-pfp {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.user-name {
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.item-name {
  font-family: var(--font-primary);
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.item-desc {
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.item-price {
  font-family: var(--font-primary);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.reflection-section {
  margin-top: 1.25rem;
}

.reflection-title {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.reflection-item {
  margin-bottom: 1rem;
  padding: 0.875rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.reflection-item strong {
  display: block;
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
}

.reflection-item p {
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  margin: 0;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 3rem;
  text-align: center;
}

.loading-message p {
  font-family: var(--font-primary);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.finished-message {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-primary);
  font-family: var(--font-secondary);
}

.anti-capitalist {
  font-size: 3rem;
  margin-top: 1rem;
}

.timeout-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
}

.timeout-message p {
  font-family: var(--font-primary);
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
}

.timeout-subtitle {
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.logout-retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  background-color: var(--color-text-primary);
  color: var(--color-bg-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.logout-retry-button:hover {
  background-color: var(--color-accent-red);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.swipe-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2.5rem;
  justify-content: center;
  position: relative;
  z-index: 10;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}

.skip-button,
.worth-button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  background-color: var(--color-text-primary);
  color: var(--color-bg-secondary);
  transition: all 0.2s ease;
  cursor: pointer;
}

.skip-button:hover:not(:disabled) {
  background-color: var(--color-accent-red);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.worth-button:hover:not(:disabled) {
  background-color: var(--color-accent-green);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.skip-button:disabled,
.worth-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1.5rem 2rem;
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .nav-right {
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .swipe-card {
    max-width: 100%;
    height: calc(100vh - 320px);
    min-height: 500px;
    flex-direction: column;
  }

  .card-image {
    width: 100%;
    min-width: unset;
    height: 40%;
    min-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    border-radius: 12px 12px 0 0;
  }

  .swipe-actions {
    flex-direction: column;
    padding: 1rem 2rem;
  }

  .skip-button,
  .worth-button {
    max-width: 100%;
  }

  .card-container {
    padding: 1rem 2rem;
  }

  .progress-bar-container {
    padding: 1rem 2rem;
  }
}
</style>
