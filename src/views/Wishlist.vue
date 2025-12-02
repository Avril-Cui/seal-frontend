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
          :class="{ 'purchased-item': item.wasPurchased }"
          @click="openEditModal(item)"
        >
          <button
            @click.stop="removeItem(item._id)"
            class="remove-button"
            title="Remove item"
          >
            ×
          </button>
          <button
            v-if="!item.wasPurchased"
            @click.stop="openPurchaseModal(item)"
            class="purchased-button"
          >
            Mark as Purchased
          </button>
          <div v-else class="purchased-label">
            Purchased
          </div>
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
            <label class="form-label">Upload Image</label>
            <div class="modal-image">
              <img
                v-if="newItemPhoto"
                :src="newItemPhoto"
                :alt="newItemName"
                class="modal-photo"
              />
              <div v-else class="image-placeholder">PIC</div>
            </div>
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="file-input"
            />
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

    <!-- Purchase Confirmation Modal -->
    <div
      v-if="showPurchaseModal"
      class="modal-overlay"
      @click="closePurchaseModal"
    >
      <div class="modal-content purchase-modal" @click.stop>
        <div class="modal-header">
          <h2>Mark as Purchased</h2>
          <button @click="closePurchaseModal" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div v-if="purchaseError" class="error-message">{{ purchaseError }}</div>

          <p class="confirmation-text">Have you purchased "{{ purchasingItem?.itemName }}"?</p>

          <div class="form-group">
            <label class="form-label">Actual Price Paid</label>
            <input
              v-model="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter price"
              class="modal-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input
              v-model.number="purchaseQuantity"
              type="number"
              step="1"
              min="1"
              placeholder="Enter quantity"
              class="modal-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Purchase Date</label>
            <input
              v-model="purchaseDate"
              type="date"
              class="modal-input"
            />
          </div>

          <div class="modal-actions">
            <button
              @click="closePurchaseModal"
              class="modal-button cancel"
            >
              Cancel
            </button>
            <button
              @click="confirmPurchase"
              class="modal-button confirm"
              :disabled="isPurchasing || !purchasePrice || !purchaseQuantity || !purchaseDate || purchaseQuantity < 1"
            >
              {{ isPurchasing ? "Saving..." : "Confirm Purchase" }}
            </button>
          </div>
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

// Purchase modal state
const showPurchaseModal = ref(false);
const purchasingItem = ref(null);
const purchasePrice = ref(0);
const purchaseQuantity = ref(1);
const purchaseDate = ref("");
const isPurchasing = ref(false);
const purchaseError = ref("");

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

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      newItemPhoto.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
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

// Open purchase modal
const openPurchaseModal = (item) => {
  purchasingItem.value = item;
  purchasePrice.value = item.price; // Default to original price
  purchaseQuantity.value = 1; // Default quantity to 1
  // Set default to today's date in YYYY-MM-DD format
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  purchaseDate.value = `${year}-${month}-${day}`;
  purchaseError.value = "";
  showPurchaseModal.value = true;
};

// Close purchase modal
const closePurchaseModal = () => {
  showPurchaseModal.value = false;
  purchasingItem.value = null;
  purchasePrice.value = 0;
  purchaseQuantity.value = 1;
  purchaseDate.value = "";
  purchaseError.value = "";
};

// Confirm purchase
const confirmPurchase = async () => {
  if (!currentUser.value?.uid || !purchasingItem.value) {
    purchaseError.value = "Invalid user or item.";
    return;
  }

  if (!purchasePrice.value || !purchaseQuantity.value || !purchaseDate.value) {
    purchaseError.value = "Please fill in all fields.";
    return;
  }

  if (purchaseQuantity.value < 1 || !Number.isInteger(purchaseQuantity.value)) {
    purchaseError.value = "Quantity must be a whole number greater than 0.";
    return;
  }

  isPurchasing.value = true;
  purchaseError.value = "";

  try {
    // Convert date string to timestamp (milliseconds)
    const purchaseTimestamp = new Date(purchaseDate.value).getTime();

    const response = await fetch(`${API_BASE_URL}/ItemCollection/setPurchased`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        owner: currentUser.value.uid,
        item: purchasingItem.value._id,
        quantity: purchaseQuantity.value,
        purchaseTime: purchaseTimestamp,
        actualPrice: parseFloat(purchasePrice.value),
      }),
    });

    const data = await response.json();

    if (data.error) {
      purchaseError.value = data.error || "Failed to mark item as purchased.";
      return;
    }

    // Success! Close modal and refresh wishlist
    closePurchaseModal();
    await fetchWishlist();
  } catch (err) {
    purchaseError.value = "Failed to mark item as purchased. Please try again.";
    console.error("Error marking as purchased:", err);
  } finally {
    isPurchasing.value = false;
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
.wishlist-container {
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

.wishlist-content {
  flex: 1;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.queue-reminder {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  background-color: #fff3cd;
  border: 2px solid #856404;
  border-radius: 12px;
  color: #2d0000;
}

.reminder-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.queue-reminder p {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
}

.add-item-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.add-item-button {
  padding: 1rem 3rem;
  font-size: 1.1rem;
  font-weight: 700;
  border: 2px solid #2d0000;
  border-radius: 8px;
  background-color: #2d0000;
  color: #f5f0e1;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.add-item-button:hover {
  background-color: #f5f0e1;
  color: #2d0000;
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
  border: 2px solid #2d0000;
  border-radius: 12px;
  padding: 1.5rem;
  background-color: #f5f0e1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wishlist-item:hover {
  box-shadow: 0 4px 8px rgba(45, 0, 0, 0.1);
  transform: translateY(-2px);
}

.wishlist-item.purchased-item {
  opacity: 0.7;
  background-color: #f0f0f0;
}

.wishlist-item.purchased-item:hover {
  opacity: 0.85;
}

.remove-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  border: 2px solid #2d0000;
  border-radius: 50%;
  background-color: #f5f0e1;
  color: #2d0000;
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
  background-color: #ef5350;
  color: #f5f0e1;
  border-color: #ef5350;
  transform: scale(1.1);
}

.purchased-button {
  position: absolute;
  top: 0.75rem;
  right: 3.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid #2d0000;
  border-radius: 8px;
  background-color: #f5f0e1;
  color: #2d0000;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.purchased-button:hover {
  background-color: #4caf50;
  color: #f5f0e1;
  border-color: #4caf50;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.purchased-label {
  position: absolute;
  top: 0.75rem;
  right: 3.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid #4caf50;
  border-radius: 8px;
  background-color: #4caf50;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.item-image {
  width: 120px;
  height: 120px;
  border: 2px solid #2d0000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f0e1;
  flex-shrink: 0;
}

.image-placeholder {
  font-size: 1.5rem;
  font-weight: 600;
  color: #87875a;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.item-desc {
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
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
  background-color: rgba(45, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background-color: #f5f0e1;
  border: 2px solid #2d0000;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #2d0000;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.close-button {
  border: none;
  background: none;
  font-size: 2rem;
  line-height: 1;
  padding: 0;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.close-button:hover {
  background-color: transparent;
  color: #2d0000;
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
  border: 2px solid #2d0000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f0e1;
}

.modal-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #2d0000;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f5f0e1;
  font-family: inherit;
}

.modal-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #2d0000;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f5f0e1;
  font-family: inherit;
  resize: vertical;
}

.file-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #2d0000;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f5f0e1;
  font-family: inherit;
  cursor: pointer;
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
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.reflection-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #2d0000;
}

.reflection-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-price {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0.5rem 0 0 0;
  color: #2d0000;
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 3rem;
  font-size: 1.1rem;
  color: #2d0000;
}

.error-message {
  padding: 0.75rem;
  background-color: #ffebee;
  border: 2px solid #ef5350;
  color: #c62828;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border-radius: 8px;
}

.modal-submit {
  width: 100%;
  margin-top: 1rem;
}

.modal-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.validation-hint {
  text-align: center;
  font-size: 0.85rem;
  color: #87875a;
  margin-top: 0.5rem;
  font-style: italic;
}

.community-stats {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #d0d0d0;
}

.locked-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background-color: rgba(135, 135, 90, 0.1);
  border-radius: 8px;
  border: 2px dashed #87875a;
}

.lock-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.lock-message {
  font-size: 0.85rem;
  color: #2d0000;
  margin: 0;
  font-weight: 500;
}

.no-stats {
  text-align: center;
  padding: 0.5rem;
}

.stat-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  border: 2px solid #2d0000;
}

.stat-badge.high-approval {
  background-color: #d4edda;
  color: #155724;
  border-color: #155724;
}

.stat-badge.medium-approval {
  background-color: #fff3cd;
  color: #856404;
  border-color: #856404;
}

.stat-badge.low-approval {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #721c24;
}

.stat-info {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
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
  .wishlist-item {
    flex-direction: column;
  }

  .item-image {
    width: 100%;
    height: 200px;
  }
}

/* Purchase Modal Styles */
.purchase-modal {
  max-width: 500px;
}

.confirmation-text {
  font-size: 1rem;
  color: #2d0000;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-button {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: 2px solid #2d0000;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-button.cancel {
  background-color: #f5f0e1;
  color: #2d0000;
}

.modal-button.cancel:hover {
  background-color: #e0dbc7;
}

.modal-button.confirm {
  background-color: #4caf50;
  color: #fff;
  border-color: #4caf50;
}

.modal-button.confirm:hover {
  background-color: #45a049;
  border-color: #45a049;
}

.modal-button.confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
