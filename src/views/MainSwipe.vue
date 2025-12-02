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
          />
          <img
            v-else
            src="../assets/pig_sprite.png"
            alt="Item placeholder"
            class="item-photo placeholder"
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

      <div v-else class="finished-message">
        <p>You've finished your queue for today!</p>
        <p class="anti-capitalist">🎉</p>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useColors } from "../composables/useColors";
import { useAuth } from "../composables/useAuth";
import Navbar from "../components/Navbar.vue";

const router = useRouter();
const { palette } = useColors();
const { currentUser, getSession } = useAuth();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const totalSwipes = ref(10);
const completedSwipes = ref(0);
const currentItemIndex = ref(0);
const swipeDirection = ref(null);
const isAnimating = ref(false);
const isSwipingLeft = ref(false);
const isSwipingRight = ref(false);
const isLoading = ref(false);

// Drag/swipe state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragCurrentX = ref(0);
const dragOffset = ref(0);

const queueItems = ref([]);

const currentItem = computed(() => {
  if (currentItemIndex.value < queueItems.value.length) {
    return queueItems.value[currentItemIndex.value];
  }
  return null;
});

const progressPercentage = computed(() => {
  return (completedSwipes.value / totalSwipes.value) * 100;
});

// Load or generate today's queue
const loadQueue = async () => {
  const session = getSession();
  if (!session) {
    console.log("No session - user not logged in");
    return;
  }

  isLoading.value = true;

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

    if (queueData.error) {
      // No queue exists for today, generate one
      console.log("No queue found, generating new queue...");

      // Get 10 random items (public route - no auth needed)
      const randomItemsResponse = await fetch(
        `${API_BASE_URL}/ItemCollection/_getTenRandomItems`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const randomItemsData = await randomItemsResponse.json();

      if (
        randomItemsData.error ||
        !Array.isArray(randomItemsData) ||
        randomItemsData.length === 0
      ) {
        console.error("Failed to get random items:", randomItemsData.error);
        return;
      }

      itemIds = randomItemsData[0].itemIdSet;

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
        console.error("Failed to generate queue:", generateData.error);
        return;
      }

      completed = 0;
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
  } catch (error) {
    console.error("Error loading queue:", error);
  } finally {
    isLoading.value = false;
  }
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
    swipeDirection.value = null;
    isSwipingLeft.value = false;
    isSwipingRight.value = false;
    isAnimating.value = false;
    dragOffset.value = 0;
  }, 600);
};

const handleSkip = () => {
  // Full color expansion on button click
  isSwipingLeft.value = true;
  isSwipingRight.value = false;
  setTimeout(() => {
    isSwipingLeft.value = false;
  }, 600); // Match the swipe animation duration
  performSwipe("left");
};

const handleWorthIt = () => {
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

onMounted(() => {
  loadQueue();
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
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  position: relative;
  z-index: 50;
  overflow: visible;
  min-height: 0;
  box-sizing: border-box;
}

.swipe-card {
  max-width: 1000px;
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background-color: var(--color-bg);
  display: flex;
  flex-direction: row;
  transition: transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease,
    border-color 0.3s ease;
  cursor: grab;
  user-select: none;
  touch-action: none;
  box-shadow: 0 2px 8px rgba(26, 26, 26, 0.04);
  max-height: 80vh;
  position: relative;
  z-index: 100;
  box-sizing: border-box;
  margin: 1px;
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
  border-right: 1px solid var(--color-border);
  border-radius: 12px 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  overflow: hidden;
  flex-shrink: 0;
  height: 100%;
  align-self: stretch;
}

.image-placeholder {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  font-family: var(--font-primary);
}

.item-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-height: 100%;
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
  max-height: 80vh;
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
