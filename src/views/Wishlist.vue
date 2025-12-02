<template>
  <div class="wishlist-container">
    <nav class="navbar">
      <div class="nav-left">
        <h1 class="nav-title">BYEBUY</h1>
      </div>
      <div class="nav-right">
        <button @click="goToSwipe" class="nav-link">SWIPESENSE</button>
        <button @click="goToWishlist" class="nav-link active">PAUSE CART</button>
        <button @click="goToStats" class="nav-link">STATS</button>
        <button @click="goToSettings" class="nav-link settings-icon">⚙</button>
      </div>
    </nav>

    <div class="wishlist-content">
      <div v-if="!hasCompletedQueue && !isCheckingQueue" class="queue-reminder">
        <div class="reminder-icon">📊</div>
        <p>Complete your daily SwipeSense queue to see what the community thinks about your items!</p>
      </div>

      <div class="add-item-section">
        <div v-if="addItemError" class="error-message">{{ addItemError }}</div>
        <button @click="openAddModal" class="add-item-button">ADD ITEM</button>
      </div>

      <div v-if="isLoading" class="loading-message">Loading your items...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="wishlistItems.length === 0" class="empty-message">
        Your pause cart is empty. Click the "ADD ITEM" button above to get started!
      </div>
      <div v-else class="items-list">
        <div
          v-for="item in wishlistItems"
          :key="item._id"
          class="wishlist-item"
          @click="openEditModal(item)"
        >
          <button
            @click.stop="removeItem(item._id)"
            class="remove-button"
            title="Remove item"
          >
            ×
          </button>
          <div class="item-image">
            <img
              v-if="item.photo"
              :src="item.photo"
              :alt="item.itemName"
              class="item-photo"
            />
            <div v-else class="image-placeholder">PIC</div>
          </div>
          <div class="item-details">
            <h3 class="item-name">{{ item.itemName }}</h3>
            <p class="item-desc">{{ item.description }}</p>
            <p class="item-price">${{ item.price.toFixed(2) }}</p>

            <div class="community-stats">
              <div v-if="!hasCompletedQueue" class="locked-stats">
                <div class="lock-icon">🔒</div>
                <p class="lock-message">
                  Complete your daily SwipeSense queue to unlock community feedback!
                </p>
              </div>
              <div v-else-if="item.communityStats && item.communityStats.total > 0">
                <div class="stat-badge" :class="getApprovalClass(item.communityStats)">
                  {{ getApprovalPercentage(item.communityStats) }}% community approval
                </div>
                <div class="stat-info">
                  {{ item.communityStats.total }} community member{{ item.communityStats.total !== 1 ? 's' : '' }} reviewed this
                </div>
              </div>
              <div v-else class="no-stats">
                <p class="stat-info">No community feedback yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Item Modal -->
    <div
      v-if="showAddModal"
      class="modal-overlay"
      @click="closeModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Edit Item' : 'Add Item' }}</h2>
          <button @click="closeModal" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div v-if="addItemError" class="error-message">{{ addItemError }}</div>

          <div class="form-group">
            <label class="form-label">Image URL</label>
            <input
              v-model="newItemPhoto"
              placeholder="Enter image URL"
              class="modal-input"
            />
            <div class="modal-image">
              <img
                v-if="newItemPhoto"
                :src="newItemPhoto"
                :alt="newItemName"
                class="modal-photo"
              />
              <div v-else class="image-placeholder">PIC</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Item Name</label>
            <input
              v-model="newItemName"
              placeholder="Enter item name"
              class="modal-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="newItemDesc"
              placeholder="Enter description"
              class="modal-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Price</label>
            <input
              v-model="newItemPrice"
              type="number"
              step="0.01"
              placeholder="Price"
              class="modal-input"
            />
          </div>

          <div class="reflection-section">
            <h3 class="reflection-title">Reflection Questions</h3>

            <div class="form-group">
              <label class="form-label">Why do you want this item?</label>
              <textarea
                v-model="reasonAnswer"
                placeholder="Enter your reason..."
                class="modal-textarea"
                rows="2"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Is this a need or a want?</label>
              <textarea
                v-model="isNeedAnswer"
                placeholder="Enter your answer..."
                class="modal-textarea"
                rows="2"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Would Future-You approve?</label>
              <textarea
                v-model="futureApproveAnswer"
                placeholder="Enter your answer..."
                class="modal-textarea"
                rows="2"
              ></textarea>
            </div>
          </div>

          <button
            @click="isEditMode ? updateItem() : addItem()"
            class="modal-submit"
            :disabled="!newItemName || !newItemDesc || !newItemPrice || !reasonAnswer || !isNeedAnswer || !futureApproveAnswer || isAddingItem"
          >
            {{ isAddingItem ? "SAVING..." : (isEditMode ? "UPDATE ITEM" : "SAVE TO PAUSE CART") }}
          </button>
          <p v-if="!newItemName || !newItemDesc || !newItemPrice || !reasonAnswer || !isNeedAnswer || !futureApproveAnswer" class="validation-hint">
            Please fill in all fields and answer all reflection questions before saving.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { currentUser } = useAuth();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const showAddModal = ref(false);
const isEditMode = ref(false);
const editingItemId = ref(null);
const newItemName = ref("");
const newItemDesc = ref("");
const newItemPhoto = ref("");
const newItemPrice = ref(0);
const reasonAnswer = ref("");
const isNeedAnswer = ref("");
const futureApproveAnswer = ref("");

const wishlistItems = ref([]);
const isLoading = ref(false);
const error = ref("");
const isAddingItem = ref(false);
const addItemError = ref("");
const hasCompletedQueue = ref(false);
const isCheckingQueue = ref(false);

// Check if user has completed their daily queue
const checkQueueCompletion = async () => {
  if (!currentUser.value?.uid) {
    return;
  }

  isCheckingQueue.value = true;

  try {
    const response = await fetch(`${API_BASE_URL}/QueueSystem/_getTodayQueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ owner: currentUser.value.uid }),
    });

    const data = await response.json();

    if (!data.error) {
      // User has a queue, check if completed
      hasCompletedQueue.value = data.completedQueue >= 10;
    } else {
      // No queue exists, consider as not completed
      hasCompletedQueue.value = false;
    }
  } catch (err) {
    console.error("Error checking queue completion:", err);
    hasCompletedQueue.value = false;
  } finally {
    isCheckingQueue.value = false;
  }
};

// Fetch user's wishlist items
const fetchWishlist = async () => {
  console.log("fetchWishlist called, currentUser:", currentUser.value);

  if (!currentUser.value?.uid) {
    console.log("No uid, not fetching wishlist");
    return;
  }

  isLoading.value = true;
  error.value = "";

  console.log("Fetching wishlist for owner:", currentUser.value.uid);

  try {
    const response = await fetch(
      `${API_BASE_URL}/ItemCollection/_getUserWishList`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner: currentUser.value.uid }),
      }
    );

    const data = await response.json();
    console.log("Wishlist response:", data);

    if (data.error) {
      console.log("Error in response:", data.error);
      // If no wishlist exists yet, just show empty list
      wishlistItems.value = [];
    } else if (Array.isArray(data)) {
      console.log("Got array of items:", data.length);
      const items = data.map((obj) => obj.item);

      // Fetch community stats for each item if queue is completed
      if (hasCompletedQueue.value) {
        const itemsWithStats = await Promise.all(
          items.map(async (item) => {
            try {
              const statsResponse = await fetch(
                `${API_BASE_URL}/SwipeSystem/_getCommunitySwipeStats`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    itemId: item._id,
                    excludeUserId: currentUser.value.uid,
                  }),
                }
              );

              const statsData = await statsResponse.json();

              if (!statsData.error) {
                return {
                  ...item,
                  communityStats: {
                    total: statsData.total,
                    approval: statsData.approval,
                  },
                };
              }
              return item;
            } catch (err) {
              console.error("Error fetching stats for item:", item._id, err);
              return item;
            }
          })
        );

        wishlistItems.value = itemsWithStats;
      } else {
        wishlistItems.value = items;
      }
    } else {
      console.log("Unexpected response format");
      wishlistItems.value = [];
    }
  } catch (err) {
    error.value = "Failed to load your items. Please try again.";
    console.error("Error fetching wishlist:", err);
  } finally {
    isLoading.value = false;
  }
};

// Open the add item modal with empty fields
const openAddModal = () => {
  // Reset all fields
  isEditMode.value = false;
  editingItemId.value = null;
  newItemName.value = "";
  newItemDesc.value = "";
  newItemPhoto.value = "";
  newItemPrice.value = 0;
  reasonAnswer.value = "";
  isNeedAnswer.value = "";
  futureApproveAnswer.value = "";
  addItemError.value = "";
  showAddModal.value = true;
};

// Open the edit modal with item's existing data
const openEditModal = (item) => {
  isEditMode.value = true;
  editingItemId.value = item._id;
  newItemName.value = item.itemName;
  newItemDesc.value = item.description;
  newItemPhoto.value = item.photo;
  newItemPrice.value = item.price;
  reasonAnswer.value = item.reason || "";
  isNeedAnswer.value = item.isNeed || "";
  futureApproveAnswer.value = item.isFutureApprove || "";
  addItemError.value = "";
  showAddModal.value = true;
};


const addItem = async () => {
  console.log("addItem called!");
  console.log("currentUser:", currentUser.value);

  if (!currentUser.value?.uid) {
    console.error("No user logged in! currentUser:", currentUser.value);
    addItemError.value = "You must be logged in to add items.";
    return;
  }

  console.log("Starting to save item...");
  isAddingItem.value = true;
  addItemError.value = "";

  const payload = {
    owner: currentUser.value.uid,
    itemName: newItemName.value,
    description: newItemDesc.value,
    photo: newItemPhoto.value,
    price: newItemPrice.value,
    reason: reasonAnswer.value,
    isNeed: isNeedAnswer.value,
    isFutureApprove: futureApproveAnswer.value,
  };

  console.log("Payload:", payload);
  console.log("Owner UID:", currentUser.value.uid);

  try {
    // Call the new addItem endpoint with all item details
    const response = await fetch(`${API_BASE_URL}/ItemCollection/addItem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", data);

    if (data.error) {
      addItemError.value = data.error || "Failed to save item. Please try again.";
      return;
    }

    // Success! Refresh the wishlist to show the new item
    console.log("Item saved successfully, refreshing wishlist...");
    await fetchWishlist();

    // Close modal and reset form
    showAddModal.value = false;

    // Reset form values
    newItemName.value = "";
    newItemDesc.value = "";
    newItemPhoto.value = "";
    newItemPrice.value = 0;
    reasonAnswer.value = "";
    isNeedAnswer.value = "";
    futureApproveAnswer.value = "";
    addItemError.value = "";
  } catch (err) {
    addItemError.value = "Failed to save item. Please try again.";
    console.error("Error saving item:", err);
  } finally {
    isAddingItem.value = false;
  }
};

// Update an existing item
const updateItem = async () => {
  console.log("updateItem called!");

  if (!currentUser.value?.uid) {
    addItemError.value = "You must be logged in to update items.";
    return;
  }

  if (!editingItemId.value) {
    addItemError.value = "No item selected for editing.";
    return;
  }

  isAddingItem.value = true;
  addItemError.value = "";

  const payload = {
    owner: currentUser.value.uid,
    itemId: editingItemId.value,
    itemName: newItemName.value,
    description: newItemDesc.value,
    photo: newItemPhoto.value,
    price: newItemPrice.value,
    reason: reasonAnswer.value,
    isNeed: isNeedAnswer.value,
    isFutureApprove: futureApproveAnswer.value,
  };

  console.log("Update payload:", payload);

  try {
    const response = await fetch(`${API_BASE_URL}/ItemCollection/updateItem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Update response:", data);

    if (data.error) {
      addItemError.value = data.error || "Failed to update item. Please try again.";
      return;
    }

    // Success! Refresh the wishlist
    console.log("Item updated successfully, refreshing wishlist...");
    await fetchWishlist();

    // Close modal and reset form
    showAddModal.value = false;
    newItemName.value = "";
    newItemDesc.value = "";
    newItemPhoto.value = "";
    newItemPrice.value = 0;
    reasonAnswer.value = "";
    isNeedAnswer.value = "";
    futureApproveAnswer.value = "";
    addItemError.value = "";
    isEditMode.value = false;
    editingItemId.value = null;
  } catch (err) {
    addItemError.value = "Failed to update item. Please try again.";
    console.error("Error updating item:", err);
  } finally {
    isAddingItem.value = false;
  }
};

// Remove an item
const removeItem = async (itemId) => {
  if (!currentUser.value?.uid) {
    error.value = "You must be logged in to remove items.";
    return;
  }

  if (!confirm("Are you sure you want to remove this item from your pause cart?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ItemCollection/removeItem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ owner: currentUser.value.uid, itemId }),
    });

    const data = await response.json();
    console.log("Remove response:", data);

    if (data.error) {
      error.value = data.error || "Failed to remove item. Please try again.";
      return;
    }

    // Success! Refresh the wishlist
    console.log("Item removed successfully, refreshing wishlist...");
    await fetchWishlist();
  } catch (err) {
    error.value = "Failed to remove item. Please try again.";
    console.error("Error removing item:", err);
  }
};

onMounted(async () => {
  await checkQueueCompletion();
  await fetchWishlist();
});

const closeModal = () => {
  showAddModal.value = false;
  addItemError.value = "";
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

// Calculate approval percentage from community stats
const getApprovalPercentage = (stats) => {
  if (!stats || stats.total === 0) return 0;
  return Math.round((stats.approval / stats.total) * 100);
};

// Get approval class based on percentage
const getApprovalClass = (stats) => {
  const percentage = getApprovalPercentage(stats);
  if (percentage >= 70) return "high-approval";
  if (percentage >= 50) return "medium-approval";
  return "low-approval";
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

.wishlist-container {
  --font-primary: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  min-height: 100vh;
  background-color: var(--color-bg);
  display: flex;
  flex-direction: column;
  color: var(--color-text-primary);
  font-family: var(--font-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2.5rem;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg);
}

.nav-left {
  display: flex;
  align-items: center;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.nav-title {
  font-family: var(--font-primary);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
}

.wishlist-content {
  flex: 1;
  padding: 2rem 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.queue-reminder {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text-primary);
}

.reminder-icon {
  font-size: 2rem;
  flex-shrink: 0;
  filter: grayscale(20%);
}

.queue-reminder p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.6;
  font-family: var(--font-secondary);
}

.add-item-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.add-item-button {
  padding: 0.75rem 1.5rem;
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: none;
  border-radius: 8px;
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-item-button:hover {
  background-color: var(--color-text-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.wishlist-item {
  position: relative;
  display: flex;
  gap: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  background-color: var(--color-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.wishlist-item:hover {
  border-color: var(--color-border-dark);
  box-shadow: 0 4px 20px rgba(26, 26, 26, 0.04);
  transform: translateY(-2px);
}

.remove-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  padding: 0;
}

.wishlist-item:hover .remove-button {
  opacity: 1;
}

.remove-button:hover {
  background-color: var(--color-accent-red);
  color: var(--color-bg);
  border-color: var(--color-accent-red);
  transform: scale(1.1);
}

.item-image {
  width: 120px;
  height: 120px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  flex-shrink: 0;
}

.image-placeholder {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  font-family: var(--font-primary);
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-name {
  font-family: var(--font-primary);
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.item-desc {
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.approval-badge {
  margin-top: auto;
  padding: 0.5rem 1rem;
  border: 2px solid #2d0000;
  border-radius: 8px;
  display: inline-block;
  font-weight: 600;
  font-size: 0.9rem;
  width: fit-content;
}

.high-approval {
  background-color: #f5f0e1;
}

.low-approval {
  background-color: #f5f0e1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(26, 26, 26, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(26, 26, 26, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-family: var(--font-primary);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.close-button {
  border: none;
  background: none;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-image {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
}

.modal-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: var(--font-secondary);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  transition: border-color 0.2s ease;
}

.modal-input:focus {
  outline: none;
  border-color: var(--color-border-dark);
}

.modal-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: var(--font-secondary);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  resize: vertical;
  transition: border-color 0.2s ease;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--color-border-dark);
}

.modal-photo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-primary);
}

.reflection-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.reflection-title {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
}

.item-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-price {
  font-family: var(--font-primary);
  font-size: 1rem;
  font-weight: 700;
  margin: 0.5rem 0 0 0;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 3rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-family: var(--font-secondary);
}

.error-message {
  padding: 0.75rem 1rem;
  background-color: var(--color-accent-pink);
  border: 1px solid var(--color-accent-red);
  border-radius: 8px;
  color: var(--color-text-primary);
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  font-family: var(--font-secondary);
}

.modal-submit {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-submit:hover:not(:disabled) {
  background-color: var(--color-text-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.modal-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.validation-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 0.5rem;
  font-family: var(--font-secondary);
}

.community-stats {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.locked-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background-color: var(--color-bg);
  border-radius: 8px;
  border: 1px dashed var(--color-border);
}

.lock-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  filter: grayscale(20%);
}

.lock-message {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0;
  font-weight: 400;
  font-family: var(--font-secondary);
}

.no-stats {
  text-align: center;
  padding: 0.5rem;
}

.stat-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: 0.5rem;
  border: 1px solid var(--color-border);
  font-family: var(--font-primary);
  text-transform: uppercase;
}

.stat-badge.high-approval {
  background-color: var(--color-accent-green);
  color: var(--color-text-primary);
  border-color: var(--color-accent-green);
}

.stat-badge.medium-approval {
  background-color: var(--color-accent-pink);
  color: var(--color-text-primary);
  border-color: var(--color-accent-pink);
}

.stat-badge.low-approval {
  background-color: var(--color-accent-pink);
  color: var(--color-text-primary);
  border-color: var(--color-accent-red);
}

.stat-info {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  font-family: var(--font-secondary);
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

.nav-link.settings-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .wishlist-item {
    flex-direction: column;
  }

  .item-image {
    width: 100%;
    height: 200px;
  }
}
</style>
