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

    <nav class="navbar">
      <div class="nav-left">
        <h1 class="nav-title">BYEBUY</h1>
      </div>
      <div class="nav-right">
        <button @click="goToSwipe" class="nav-link active">SWIPESENSE</button>
        <button @click="goToWishlist" class="nav-link">PAUSE CART</button>
        <button @click="goToStats" class="nav-link">STATS</button>
        <button @click="goToSettings" class="nav-link settings-icon">⚙</button>
      </div>
    </nav>

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
          <div v-else class="image-placeholder">PIC</div>
        </div>
        <div class="card-content">
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

const router = useRouter();
const { palette } = useColors();
const { currentUser } = useAuth();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
  if (!currentUser.value?.uid) {
    console.log("No user logged in");
    return;
  }

  isLoading.value = true;

  try {
    // First, try to get today's queue
    const queueResponse = await fetch(`${API_BASE_URL}/QueueSystem/_getTodayQueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ owner: currentUser.value.uid }),
    });

    const queueData = await queueResponse.json();

    let itemIds = [];
    let completed = 0;

    if (queueData.error) {
      // No queue exists for today, generate one
      console.log("No queue found, generating new queue...");

      // Get 10 random items
      const randomItemsResponse = await fetch(
        `${API_BASE_URL}/ItemCollection/_getTenRandomItems`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ owner: currentUser.value.uid }),
        }
      );

      const randomItemsData = await randomItemsResponse.json();

      if (randomItemsData.error || !Array.isArray(randomItemsData) || randomItemsData.length === 0) {
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
          body: JSON.stringify({ owner: currentUser.value.uid, itemIds }),
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

    // Fetch full item details for each itemId
    const itemDetailsPromises = itemIds.map((itemId) =>
      fetch(`${API_BASE_URL}/ItemCollection/_getItemDetails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      }).then((res) => res.json())
    );

    const itemDetailsResponses = await Promise.all(itemDetailsPromises);

    // Extract items from responses
    const items = itemDetailsResponses
      .filter((response) => !response.error && Array.isArray(response) && response.length > 0)
      .map((response) => response[0].item);

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

  // Record the swipe
  try {
    await fetch(`${API_BASE_URL}/SwipeSystem/recordSwipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerUserId: currentUser.value.uid,
        itemId: item._id,
        decision: decision,
      }),
    });

    // Increment completed queue
    await fetch(`${API_BASE_URL}/QueueSystem/incrementCompletedQueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner: currentUser.value.uid,
        itemId: item._id,
      }),
    });
  } catch (error) {
    console.error("Error recording swipe:", error);
  }

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

onMounted(() => {
  loadQueue();
});
</script>

<style scoped>
.swipe-container {
  min-height: 100vh;
  background-color: #f5f0e1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
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
  z-index: 1; /* Behind card (z-index: 5), buttons, nav (z-index: 10), but above background */
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    background-color 0.3s ease;
}

/* No transition during dragging for instant feedback */
.color-overlay.dragging {
  transition: background-color 0.2s ease;
}

.color-overlay.expand-red {
  background-color: v-bind("palette.red");
}

.color-overlay.expand-green {
  background-color: v-bind("palette.green");
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #2d0000;
  position: relative;
  z-index: 10;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0;
  color: #2d0000;
}

.progress-bar-container {
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 10;
}

.progress-bar {
  flex: 1;
  height: 16px;
  border: 2px solid #2d0000;
  border-radius: 12px;
  background-color: #f5f0e1;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 2px;
  left: 2px;
  height: calc(100% - 4px);
  background-color: #2d0000;
  transition: width 0.3s;
  border-radius: 10px 0 0 10px;
}

.progress-fill.full {
  border-radius: 10px;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 60px;
  color: #2d0000;
}

.card-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  position: relative;
  z-index: 5;
  overflow: visible;
  min-height: 0;
}

.swipe-card {
  max-width: 400px;
  width: 100%;
  border: 2px solid #2d0000;
  border-radius: 12px;
  background-color: #f5f0e1;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, opacity 0.3s ease;
  cursor: grab;
  user-select: none;
  touch-action: none;
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
  width: 100%;
  aspect-ratio: 1;
  border-bottom: 2px solid #2d0000;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f0e1;
  overflow: hidden;
}

.image-placeholder {
  font-size: 2rem;
  font-weight: 600;
  color: #87875a;
}

.item-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.item-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2d0000;
}

.item-desc {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  line-height: 1.5;
  color: #2d0000;
}

.item-price {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #2d0000;
}

.reflection-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #2d0000;
}

.reflection-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #2d0000;
}

.reflection-item {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(135, 135, 90, 0.1);
  border-radius: 8px;
}

.reflection-item strong {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
  color: #2d0000;
}

.reflection-item p {
  font-size: 0.95rem;
  line-height: 1.4;
  color: #2d0000;
  margin: 0;
  font-style: italic;
}

.finished-message {
  text-align: center;
  padding: 3rem;
  color: #2d0000;
}

.anti-capitalist {
  font-size: 3rem;
  margin-top: 1rem;
}

.swipe-actions {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  justify-content: center;
  position: relative;
  z-index: 10;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.skip-button,
.worth-button {
  flex: 1;
  padding: 1.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  border: 2px solid #2d0000;
  border-radius: 12px;
  background-color: #f5f0e1;
  color: #2d0000;
  transition: all 0.3s ease;
}

.skip-button:hover:not(:disabled) {
  background-color: v-bind("palette.red");
  color: #f5f0e1;
  border-color: v-bind("palette.red");
  transform: scale(1.05);
}

.worth-button:hover:not(:disabled) {
  background-color: v-bind("palette.green");
  color: #f5f0e1;
  border-color: v-bind("palette.green");
  transform: scale(1.05);
}

.skip-button:disabled,
.worth-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  .navbar {
    padding: 1rem;
  }

  .swipe-card {
    max-width: 100%;
  }

  .swipe-actions {
    flex-direction: column;
  }

  .skip-button,
  .worth-button {
    max-width: 100%;
  }
}
</style>
