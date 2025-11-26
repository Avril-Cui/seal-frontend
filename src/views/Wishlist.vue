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
              <div class="stat-badge" :class="getCommunityApprovalClass(item)">
                {{ getCommunityApproval(item) }}% community approval
              </div>
              <div class="stat-info">
                {{ getCommunityCount(item) }} people paused this •
                {{ getCommunityPurchased(item) }}% eventually bought it
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
      wishlistItems.value = data.map((obj) => obj.item);
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

onMounted(() => {
  fetchWishlist();
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

// Generate mock community stats based on item price
const getCommunityApproval = (item) => {
  // Higher priced items tend to have lower approval in our mock
  const baseApproval = item.price > 100 ? 45 : item.price > 50 ? 60 : 75;
  const variance = Math.floor(Math.random() * 20) - 10;
  return Math.max(30, Math.min(95, baseApproval + variance));
};

const getCommunityApprovalClass = (item) => {
  const approval = getCommunityApproval(item);
  if (approval >= 70) return "high-approval";
  if (approval >= 50) return "medium-approval";
  return "low-approval";
};

const getCommunityCount = (item) => {
  // Generate a consistent count based on item name length (pseudo-random but consistent)
  const base = item.itemName.length * 3;
  return base + Math.floor(Math.random() * 20);
};

const getCommunityPurchased = (item) => {
  // Lower approval items have lower purchase rates
  const approval = getCommunityApproval(item);
  const basePurchase = Math.floor(approval * 0.6);
  return Math.max(20, Math.min(85, basePurchase));
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
</style>
