<template>
  <div class="wishlist-container">
    <Navbar />

    <div class="wishlist-content">
      <div v-if="!hasCompletedQueue && !isCheckingQueue" class="queue-reminder">
        <div class="reminder-icon">📊</div>
        <p>
          Complete your daily SwipeSense queue to see what the community thinks
          about your items!
        </p>
      </div>

      <div class="add-item-section">
        <div v-if="addItemError" class="error-message">{{ addItemError }}</div>
        <button @click="openAddModal" class="add-item-button">ADD ITEM</button>
      </div>

      <div v-if="isLoading" class="loading-message">Loading your items...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div v-else-if="wishlistItems.length === 0" class="empty-message">
        Your pause cart is empty. Click the "ADD ITEM" button above to get
        started!
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
          <div v-else class="purchased-label">Purchased</div>
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
            <a
              v-if="item.amazonUrl"
              :href="item.amazonUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="amazon-link"
              @click.stop
            >
              🔗 View on Amazon
            </a>

            <!-- AI Insight Section -->
            <div class="ai-insight-section">
              <button
                v-if="!item.aiInsight && !item.isLoadingAI"
                @click.stop="getAIInsight(item)"
                class="ai-insight-button"
              >
                🤖 Get AI Insight
              </button>
              <div v-if="item.isLoadingAI" class="ai-loading">
                <span class="loading-spinner">⏳</span> Analyzing purchase...
              </div>
              <div v-if="item.aiInsight" class="ai-insight-content">
                <div class="ai-header">
                  <span>🤖 AI Analysis</span>
                  <button
                    @click.stop="
                      item.aiInsight = null;
                      item.aiStructured = null;
                    "
                    class="ai-dismiss-x"
                  >
                    ×
                  </button>
                </div>

                <!-- Structured Display -->
                <div v-if="item.aiStructured" class="ai-structured">
                  <div class="ai-verdict-row">
                    <div
                      class="ai-score"
                      :class="getScoreClass(item.aiStructured.impulseScore)"
                    >
                      {{ item.aiStructured.impulseScore }}/10
                    </div>
                    <div
                      class="ai-verdict"
                      :class="getVerdictClass(item.aiStructured.verdict)"
                    >
                      {{ item.aiStructured.verdict }}
                    </div>
                  </div>

                  <div class="ai-insight-item">
                    <span class="ai-label">💡 Insight:</span>
                    <span class="ai-value">{{
                      item.aiStructured.keyInsight
                    }}</span>
                  </div>

                  <div class="ai-insight-item">
                    <span class="ai-label">📊 Fact:</span>
                    <span class="ai-value">{{ item.aiStructured.fact }}</span>
                  </div>

                  <div class="ai-insight-item ai-advice">
                    <span class="ai-label">✅ Advice:</span>
                    <span class="ai-value">{{ item.aiStructured.advice }}</span>
                  </div>
                </div>

                <!-- Fallback plain text -->
                <p v-else class="ai-text">{{ item.aiInsight }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Item Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? "Edit Item" : "Add Item" }}</h2>
          <button @click="closeModal" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div v-if="addItemError" class="error-message">
            {{ addItemError }}
          </div>

          <!-- Amazon URL Section -->
          <div class="amazon-url-section">
            <div class="form-group">
              <label class="form-label">Amazon Product URL</label>
              <div class="url-input-row">
                <input
                  v-model="amazonUrl"
                  placeholder="Paste Amazon product URL here..."
                  class="modal-input url-input"
                  :disabled="isFetchingDetails"
                />
                <button
                  @click="fetchAmazonDetails"
                  class="fetch-button"
                  :disabled="!amazonUrl || isFetchingDetails"
                >
                  {{ isFetchingDetails ? "FETCHING..." : "FETCH" }}
                </button>
              </div>
              <p class="url-hint">
                Paste an Amazon URL to auto-fill product details, or enter
                manually below
              </p>
            </div>
          </div>

          <div class="divider-with-text">
            <span>Product Details</span>
          </div>

          <div class="form-group">
            <label class="form-label"
              >Image URL <span class="required-asterisk">*</span></label
            >
            <input
              v-model="newItemPhoto"
              placeholder="Enter image URL"
              class="modal-input"
              :class="{
                'input-error':
                  submissionAttempted &&
                  (!newItemPhoto || !newItemPhoto.trim()),
              }"
            />
            <p
              v-if="
                submissionAttempted && (!newItemPhoto || !newItemPhoto.trim())
              "
              class="price-warning"
            >
              ⚠️ Image URL is required
            </p>
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
            <label class="form-label"
              >Item Name <span class="required-asterisk">*</span></label
            >
            <input
              v-model="newItemName"
              placeholder="Enter item name"
              class="modal-input"
              :class="{
                'input-error':
                  submissionAttempted && (!newItemName || !newItemName.trim()),
              }"
            />
            <p
              v-if="
                submissionAttempted && (!newItemName || !newItemName.trim())
              "
              class="field-warning"
            >
              ⚠️ Item name is required
            </p>
          </div>

          <div class="form-group">
            <label class="form-label"
              >Description <span class="required-asterisk">*</span></label
            >
            <textarea
              v-model="newItemDesc"
              placeholder="Enter description"
              class="modal-textarea"
              rows="3"
              :class="{
                'input-error':
                  submissionAttempted && (!newItemDesc || !newItemDesc.trim()),
              }"
            ></textarea>
            <p
              v-if="
                submissionAttempted && (!newItemDesc || !newItemDesc.trim())
              "
              class="field-warning"
            >
              ⚠️ Description is required
            </p>
          </div>

          <div class="form-group">
            <label class="form-label"
              >Price <span class="required-asterisk">*</span></label
            >
            <div class="price-input-wrapper">
              <span class="price-prefix">$</span>
              <input
                :value="newItemPrice"
                @input="handlePriceInput"
                @keydown="handlePriceKeydown"
                type="text"
                inputmode="numeric"
                placeholder="0.00"
                class="modal-input price-input"
                :class="{
                  'input-error':
                    newItemPrice !== '0.00' &&
                    newItemPrice !== '' &&
                    isPriceInvalid(newItemPrice),
                }"
              />
            </div>
            <p
              v-if="
                newItemPrice !== '0.00' &&
                newItemPrice !== '' &&
                isPriceInvalid(newItemPrice)
              "
              class="price-warning"
            >
              ⚠️ {{ priceErrorMessage }}
            </p>
          </div>

          <div class="reflection-section">
            <h3 class="reflection-title">Reflection Questions</h3>

            <div class="form-group">
              <label class="form-label"
                >Why do you want this item?
                <span class="required-asterisk">*</span></label
              >
              <textarea
                v-model="reasonAnswer"
                placeholder="Enter your reason..."
                class="modal-textarea"
                rows="2"
                :class="{
                  'input-error':
                    submissionAttempted &&
                    (!reasonAnswer || !reasonAnswer.trim()),
                }"
              ></textarea>
              <p
                v-if="
                  submissionAttempted && (!reasonAnswer || !reasonAnswer.trim())
                "
                class="field-warning"
              >
                ⚠️ Please explain why you want this item
              </p>
            </div>

            <div class="form-group">
              <label class="form-label"
                >Is this a need or a want?
                <span class="required-asterisk">*</span></label
              >
              <textarea
                v-model="isNeedAnswer"
                placeholder="Enter your answer..."
                class="modal-textarea"
                rows="2"
                :class="{
                  'input-error':
                    submissionAttempted &&
                    (!isNeedAnswer || !isNeedAnswer.trim()),
                }"
              ></textarea>
              <p
                v-if="
                  submissionAttempted && (!isNeedAnswer || !isNeedAnswer.trim())
                "
                class="field-warning"
              >
                ⚠️ Please answer: is this a need or a want?
              </p>
            </div>

            <div class="form-group">
              <label class="form-label"
                >Would Future-You approve?
                <span class="required-asterisk">*</span></label
              >
              <textarea
                v-model="futureApproveAnswer"
                placeholder="Enter your answer..."
                class="modal-textarea"
                rows="2"
                :class="{
                  'input-error':
                    submissionAttempted &&
                    (!futureApproveAnswer || !futureApproveAnswer.trim()),
                }"
              ></textarea>
              <p
                v-if="
                  submissionAttempted &&
                  (!futureApproveAnswer || !futureApproveAnswer.trim())
                "
                class="field-warning"
              >
                ⚠️ Please answer: would future-you approve?
              </p>
            </div>
          </div>

          <button
            @click="
              submissionAttempted = true;
              isEditMode ? updateItem() : addItem();
            "
            class="modal-submit"
            :disabled="isAddingItem"
          >
            {{
              isAddingItem
                ? "SAVING..."
                : isEditMode
                ? "UPDATE ITEM"
                : "SAVE TO PAUSE CART"
            }}
          </button>
          <p v-if="hasValidationErrors" class="validation-error-summary">
            ⚠️ Please fix errors above before saving
          </p>
          <p
            v-else-if="
              !newItemName ||
              !newItemDesc ||
              !newItemPrice ||
              !reasonAnswer ||
              !isNeedAnswer ||
              !futureApproveAnswer
            "
            class="validation-hint"
          >
            Please fill in all fields and answer all reflection questions before
            saving.
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
          <div v-if="purchaseError" class="error-message">
            {{ purchaseError }}
          </div>

          <p class="confirmation-text">
            Have you purchased "{{ purchasingItem?.itemName }}"?
          </p>

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
            <input v-model="purchaseDate" type="date" class="modal-input" />
          </div>

          <div class="modal-actions">
            <button @click="closePurchaseModal" class="modal-button cancel">
              Cancel
            </button>
            <button
              @click="confirmPurchase"
              class="modal-button confirm"
              :disabled="
                isPurchasing ||
                !purchasePrice ||
                !purchaseQuantity ||
                !purchaseDate ||
                purchaseQuantity < 1
              "
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
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import Navbar from "../components/Navbar.vue";

const router = useRouter();
const { currentUser, getSession } = useAuth();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const showAddModal = ref(false);
const isEditMode = ref(false);
const editingItemId = ref(null);
const newItemName = ref("");
const newItemDesc = ref("");
const newItemPhoto = ref("");
const newItemPrice = ref("0.00");
const reasonAnswer = ref("");
const isNeedAnswer = ref("");
const futureApproveAnswer = ref("");
const submissionAttempted = ref(false);

// Currency input handler - formats as XX.XX (cents-first input like ATM)
const handlePriceInput = (event) => {
  // Get only digits from input
  const digits = event.target.value.replace(/\D/g, "");

  // Convert to cents then format
  const cents = parseInt(digits || "0", 10);
  const formatted = (cents / 100).toFixed(2);

  newItemPrice.value = formatted;

  // Update input value to formatted
  event.target.value = formatted;
};

const handlePriceKeydown = (event) => {
  // Allow: backspace, delete, tab, escape, enter, arrows
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
  ];
  if (allowedKeys.includes(event.key)) {
    return;
  }

  // Only allow digits
  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
};

// Helper function to check if price is invalid
const isPriceInvalid = (priceValue) => {
  // Check if empty or null
  if (priceValue === "" || priceValue === null || priceValue === undefined) {
    return true;
  }

  // Convert to string and trim
  const priceStr = String(priceValue).trim();
  if (priceStr === "" || priceStr === "-" || priceStr === "0.00") return true;

  // Check if it's a valid price format (XX.XX with exactly 2 decimal places)
  const validPricePattern = /^\d+\.\d{2}$/;
  if (!validPricePattern.test(priceStr)) return true;

  // Check if it's a valid number using parseFloat
  const priceNum = parseFloat(priceStr);

  // If NaN, it's invalid
  if (isNaN(priceNum)) return true;

  // If <= 0, it's invalid
  if (priceNum <= 0) return true;

  return false;
};

// Computed property to check for validation errors
const hasValidationErrors = computed(() => {
  if (!submissionAttempted.value) return false;

  const hasNameError = !newItemName.value || !newItemName.value.trim();
  const hasDescError = !newItemDesc.value || !newItemDesc.value.trim();
  const hasPhotoError = !newItemPhoto.value || !newItemPhoto.value.trim();
  const hasPriceError = isPriceInvalid(newItemPrice.value);
  const hasReasonError = !reasonAnswer.value || !reasonAnswer.value.trim();
  const hasNeedError = !isNeedAnswer.value || !isNeedAnswer.value.trim();
  const hasFutureError =
    !futureApproveAnswer.value || !futureApproveAnswer.value.trim();

  return (
    hasNameError ||
    hasDescError ||
    hasPhotoError ||
    hasPriceError ||
    hasReasonError ||
    hasNeedError ||
    hasFutureError
  );
});

// Computed property for price error message (real-time)
const priceErrorMessage = computed(() => {
  if (!isPriceInvalid(newItemPrice.value)) return "";

  const priceStr = String(newItemPrice.value || "").trim();

  // Check if empty or zero - only show after submission attempt
  if (priceStr === "" || priceStr === "0.00") {
    return submissionAttempted.value ? "Price is required" : "";
  }

  const priceNum = parseFloat(priceStr);

  if (priceNum <= 0) {
    return "Price must be greater than $0";
  }

  return "Invalid price";
});

// Amazon URL fetching
const amazonUrl = ref("");
const isFetchingDetails = ref(false);

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
  const session = getSession();
  if (!session) {
    return;
  }

  isCheckingQueue.value = true;

  try {
    const response = await fetch(`${API_BASE_URL}/QueueSystem/_getTodayQueue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session }),
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

  const session = getSession();
  if (!session) {
    console.log("No session, not fetching wishlist");
    return;
  }

  isLoading.value = true;
  error.value = "";

  console.log("Fetching wishlist with session");

  try {
    const response = await fetch(
      `${API_BASE_URL}/ItemCollection/_getUserWishList`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session }),
      }
    );

    const data = await response.json();
    console.log("Wishlist response:", data);
    console.log("data.items:", data.items);
    console.log("typeof data.items:", typeof data.items);
    console.log("Array.isArray(data.items):", Array.isArray(data.items));

    if (data.error) {
      console.log("Error in response:", data.error);
      wishlistItems.value = [];
      return;
    }

    // Extract items from various possible response formats
    let items = [];

    if (data.items && Array.isArray(data.items)) {
      // Format: { items: [{item: {...}}, ...] } or { items: [{...}, ...] }
      console.log("Found data.items array with length:", data.items.length);
      console.log("First raw item from data.items:", data.items[0]);
      items = data.items.map((obj) => {
        const extracted = obj.item ? obj.item : obj;
        console.log("Extracted item from obj:", extracted);
        console.log("Extracted item._id:", extracted._id);
        return extracted;
      });
    } else if (Array.isArray(data)) {
      // Format: [{item: {...}}, ...] or [{...}, ...]
      console.log("Found direct array with length:", data.length);
      items = data.map((obj) => (obj.item ? obj.item : obj));
    } else {
      console.log("Unexpected format, keys:", Object.keys(data));
      wishlistItems.value = [];
      return;
    }

    console.log("Extracted items:", items);
    console.log("First extracted item _id:", items[0]?._id);

    // Community stats removed - AI insight doesn't need swipe stats
    wishlistItems.value = items;

    console.log("Final wishlistItems:", wishlistItems.value);
  } catch (err) {
    error.value = "Failed to load your items. Please try again.";
    console.error("Error fetching wishlist:", err);
  } finally {
    isLoading.value = false;
  }
};

// Fetch product details from Amazon URL
const fetchAmazonDetails = async () => {
  if (!amazonUrl.value) {
    addItemError.value = "Please enter an Amazon URL";
    return;
  }

  isFetchingDetails.value = true;
  addItemError.value = "";

  try {
    const response = await fetch(
      `${API_BASE_URL}/ItemCollection/fetchAmazonDetails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: amazonUrl.value }),
      }
    );

    const data = await response.json();
    console.log("Amazon fetch response:", data);

    if (data.error) {
      addItemError.value = data.error;
      return;
    }

    // Auto-fill the form with fetched data
    newItemName.value = data.itemName || "";
    newItemDesc.value = data.description || "";
    newItemPhoto.value = data.photo || "";
    newItemPrice.value = (data.price || 0).toFixed(2);

    console.log("Auto-filled form with Amazon data");
  } catch (err) {
    addItemError.value =
      "Failed to fetch Amazon details. Please enter manually.";
    console.error("Error fetching Amazon details:", err);
  } finally {
    isFetchingDetails.value = false;
  }
};

// Open the add item modal with empty fields
const openAddModal = () => {
  // Reset all fields
  isEditMode.value = false;
  editingItemId.value = null;
  amazonUrl.value = "";
  newItemName.value = "";
  newItemDesc.value = "";
  newItemPhoto.value = "";
  newItemPrice.value = "0.00";
  reasonAnswer.value = "";
  isNeedAnswer.value = "";
  futureApproveAnswer.value = "";
  addItemError.value = "";
  submissionAttempted.value = false;
  showAddModal.value = true;
};

// Open the edit modal with item's existing data
const openEditModal = (item) => {
  isEditMode.value = true;
  editingItemId.value = item._id;
  newItemName.value = item.itemName;
  newItemDesc.value = item.description;
  newItemPhoto.value = item.photo;
  newItemPrice.value = parseFloat(item.price || 0).toFixed(2);
  reasonAnswer.value = item.reason || "";
  isNeedAnswer.value = item.isNeed || "";
  futureApproveAnswer.value = item.isFutureApprove || "";
  addItemError.value = "";
  submissionAttempted.value = false;
  showAddModal.value = true;
};

const addItem = async () => {
  console.log("addItem called!");
  console.log("currentUser:", currentUser.value);
  console.log("getSession():", getSession());

  const session = getSession();
  if (!session) {
    console.error("No session! User not logged in.");
    console.error("currentUser value:", currentUser.value);
    console.error(
      "sessionToken from localStorage:",
      localStorage.getItem("sessionToken")
    );

    // If we have a currentUser but no session, the session expired or was lost
    if (currentUser.value) {
      addItemError.value =
        "Your session has expired. Please log out and log back in to continue.";
      // Optionally, auto-redirect to login after a delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      addItemError.value = "You must be logged in to add items.";
      router.push("/login");
    }
    return;
  }

  // Validate all required fields (errors shown per-field)
  const priceNum = Number(newItemPrice.value);
  if (
    !newItemName.value?.trim() ||
    !newItemDesc.value?.trim() ||
    !newItemPhoto.value?.trim() ||
    !newItemPrice.value ||
    isNaN(priceNum) ||
    priceNum <= 0 ||
    !reasonAnswer.value?.trim() ||
    !isNeedAnswer.value?.trim() ||
    !futureApproveAnswer.value?.trim()
  ) {
    return; // Individual field warnings are shown
  }

  console.log("Starting to save item...");
  isAddingItem.value = true;
  addItemError.value = "";

  const payload = {
    session,
    itemName: newItemName.value,
    description: newItemDesc.value,
    photo: newItemPhoto.value,
    price: Number(newItemPrice.value),
    reason: reasonAnswer.value,
    isNeed: isNeedAnswer.value,
    isFutureApprove: futureApproveAnswer.value,
    amazonUrl: amazonUrl.value || undefined, // Include Amazon URL if present
  };

  console.log("Payload:", payload);

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
      addItemError.value =
        data.error || "Failed to save item. Please try again.";
      return;
    }

    // Success! Refresh the wishlist to show the new item
    console.log("Item saved successfully, refreshing wishlist...");
    await fetchWishlist();

    // Close modal and reset form
    showAddModal.value = false;
    submissionAttempted.value = false;

    // Reset form values
    amazonUrl.value = "";
    newItemName.value = "";
    newItemDesc.value = "";
    newItemPhoto.value = "";
    newItemPrice.value = "0.00";
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

  const session = getSession();
  if (!session) {
    addItemError.value = "You must be logged in to update items.";
    return;
  }

  if (!editingItemId.value) {
    addItemError.value = "No item selected for editing.";
    return;
  }

  // Validate all required fields (errors shown per-field)
  const priceNum = Number(newItemPrice.value);
  if (
    !newItemName.value?.trim() ||
    !newItemDesc.value?.trim() ||
    !newItemPhoto.value?.trim() ||
    !newItemPrice.value ||
    isNaN(priceNum) ||
    priceNum <= 0 ||
    !reasonAnswer.value?.trim() ||
    !isNeedAnswer.value?.trim() ||
    !futureApproveAnswer.value?.trim()
  ) {
    return; // Individual field warnings are shown
  }

  isAddingItem.value = true;
  addItemError.value = "";

  const payload = {
    session,
    itemId: editingItemId.value,
    itemName: newItemName.value,
    description: newItemDesc.value,
    photo: newItemPhoto.value,
    price: Number(newItemPrice.value),
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
      addItemError.value =
        data.error || "Failed to update item. Please try again.";
      return;
    }

    // Success! Refresh the wishlist
    console.log("Item updated successfully, refreshing wishlist...");
    await fetchWishlist();

    // Close modal and reset form
    showAddModal.value = false;
    submissionAttempted.value = false;
    newItemName.value = "";
    newItemDesc.value = "";
    newItemPhoto.value = "";
    newItemPrice.value = "0.00";
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
  const session = getSession();
  if (!session) {
    error.value = "You must be logged in to remove items.";
    return;
  }

  if (
    !confirm("Are you sure you want to remove this item from your pause cart?")
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ItemCollection/removeItem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session, itemId }),
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
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
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
    // Get session token for authentication
    const session = getSession();
    if (!session) {
      purchaseError.value = "Your session has expired. Please log in again.";
      isPurchasing.value = false;
      return;
    }

    // Convert date string to timestamp (milliseconds)
    const purchaseTimestamp = new Date(purchaseDate.value).getTime();

    const response = await fetch(`${API_BASE_URL}/ItemCollection/setPurchased`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: session,
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
  submissionAttempted.value = false;
};

// Get AI insight for an item
const getAIInsight = async (item) => {
  console.log("getAIInsight called with item:", item);
  console.log("item._id:", item._id);
  console.log("item keys:", Object.keys(item));

  const session = getSession();
  if (!session) {
    console.error("No session - user not logged in");
    return;
  }

  // Get the item ID - it might be _id or id depending on the response format
  const itemId = item._id || item.id;
  console.log("Using itemId:", itemId);

  if (!itemId) {
    console.error(
      "No item ID found! Item structure:",
      JSON.stringify(item, null, 2)
    );
    item.aiInsight = "Error: Could not find item ID";
    return;
  }

  // Set loading state
  item.isLoadingAI = true;

  try {
    const response = await fetch(
      `${API_BASE_URL}/ItemCollection/getAIInsight`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session,
          itemId: itemId,
        }),
      }
    );

    const data = await response.json();
    console.log("AI Insight response:", data);

    if (data.error) {
      item.aiInsight = `Error: ${data.error}`;
      item.aiStructured = null;
    } else {
      item.aiInsight = data.llm_response;
      item.aiStructured = data.structured || null;
    }
  } catch (err) {
    console.error("Error getting AI insight:", err);
    item.aiInsight = "Failed to get AI insight. Please try again.";
    item.aiStructured = null;
  } finally {
    item.isLoadingAI = false;
  }
};

// Helper functions for AI insight styling
const getScoreClass = (score) => {
  if (score <= 3) return "score-low";
  if (score <= 6) return "score-medium";
  return "score-high";
};

const getVerdictClass = (verdict) => {
  if (!verdict) return "";
  const v = verdict.toUpperCase();
  if (v === "BUY") return "verdict-buy";
  if (v === "WAIT") return "verdict-wait";
  return "verdict-skip";
};

// Community stats functions removed - AI insight doesn't need swipe stats
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap");

.wishlist-container {
  --font-primary: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif;

  min-height: 100vh;
  background-color: var(--color-bg);
  display: flex;
  flex-direction: column;
  color: var(--color-text-primary);
  font-family: var(--font-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
  border-radius: 16px;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(250, 250, 250, 1) 100%
  );
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.wishlist-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--color-accent-pink) 0%,
    var(--color-accent-green) 50%,
    var(--color-text-primary) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.wishlist-item:hover {
  border-color: var(--color-border-dark);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  transform: translateY(-4px);
}

.wishlist-item:hover::before {
  opacity: 1;
}

.wishlist-item.purchased-item {
  background: linear-gradient(
    135deg,
    rgba(245, 245, 245, 1) 0%,
    rgba(238, 238, 238, 1) 100%
  );
  opacity: 0.8;
  border-color: var(--color-border);
}

.wishlist-item.purchased-item::before {
  background: #4caf50;
  opacity: 1;
}

.wishlist-item.purchased-item:hover {
  opacity: 0.9;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.remove-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border: 2px solid var(--color-border);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.wishlist-item:hover .remove-button {
  opacity: 1;
}

.remove-button:hover {
  background-color: var(--color-accent-red);
  color: var(--color-bg);
  border-color: var(--color-accent-red);
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 4px 16px rgba(255, 82, 82, 0.3);
}

.purchased-button {
  position: absolute;
  top: 1rem;
  right: 4rem;
  padding: 0.625rem 1.25rem;
  border: 2px solid var(--color-text-primary);
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(250, 250, 250, 1) 100%
  );
  color: var(--color-text-primary);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: var(--font-primary);
  z-index: 10;
}

.purchased-button:hover {
  background: var(--color-accent-green);
  color: var(--color-bg);
  border-color: var(--color-accent-green);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.25);
}

.purchased-label {
  position: absolute;
  top: 1rem;
  right: 4rem;
  padding: 0.625rem 1.25rem;
  border: 2px solid #4caf50;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    #4caf50 0%,
    #45a049 100%
  );
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  font-family: var(--font-primary);
  z-index: 10;
}

.item-image {
  width: 140px;
  height: 140px;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-bg-tertiary) 0%,
    var(--color-bg-secondary) 100%
  );
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.wishlist-item:hover .item-image {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.item-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
  font-family: var(--font-primary);
  text-transform: uppercase;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  min-width: 0;
}

.item-name {
  font-family: var(--font-primary);
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.item-desc {
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.6;
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.modal-input.input-error {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

/* Hide spinner buttons for number inputs */
.modal-input[type="number"]::-webkit-inner-spin-button,
.modal-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.modal-input[type="number"] {
  -moz-appearance: textfield;
}

.price-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.price-prefix {
  position: absolute;
  left: 14px;
  color: #666;
  font-weight: 600;
  font-size: 1rem;
  pointer-events: none;
}

.price-input {
  padding-left: 28px !important;
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  letter-spacing: 0.5px;
}

.price-warning,
.field-warning {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.modal-textarea.input-error {
  border-color: #e74c3c;
  background-color: #fff5f5;
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

.required-asterisk {
  color: #e74c3c;
  font-weight: 700;
  margin-left: 2px;
}

/* Amazon URL Section Styles */
.amazon-url-section {
  background-color: var(--color-bg-secondary);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
}

.url-input-row {
  display: flex;
  gap: 0.5rem;
}

.url-input {
  flex: 1;
}

.fetch-button {
  padding: 0.875rem 1.25rem;
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.fetch-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(26, 26, 26, 0.15);
}

.fetch-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.url-hint {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  margin-top: 0.5rem;
  font-family: var(--font-secondary);
}

.divider-with-text {
  display: flex;
  align-items: center;
  margin: 1rem 0;
}

.divider-with-text::before,
.divider-with-text::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: var(--color-border);
}

.divider-with-text span {
  padding: 0 1rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  font-family: var(--font-primary);
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
  font-size: 1.25rem;
  font-weight: 800;
  margin: 0.25rem 0;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  background: linear-gradient(
    135deg,
    var(--color-text-primary) 0%,
    var(--color-text-secondary) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.amazon-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.625rem 1.125rem;
  font-family: var(--font-primary);
  font-size: 0.675rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  background: linear-gradient(
    135deg,
    #fff8f0 0%,
    #fff3e6 100%
  );
  color: #ff9900;
  border: 2px solid #ff9900;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(255, 153, 0, 0.1);
}

.amazon-link:hover {
  background: linear-gradient(
    135deg,
    #ff9900 0%,
    #ff8800 100%
  );
  color: #fff;
  border-color: #ff9900;
  text-decoration: none;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 153, 0, 0.25);
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

.validation-error-summary {
  text-align: center;
  font-size: 0.875rem;
  color: #e74c3c;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  font-family: var(--font-secondary);
  font-weight: 500;
}

/* AI Insight Styles */
.ai-insight-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.ai-insight-button {
  padding: 0.5rem 1rem;
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-insight-button:hover {
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  border-color: var(--color-text-primary);
}

.ai-loading {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-family: var(--font-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.ai-insight-content {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.ai-header {
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-dismiss-x {
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.ai-dismiss-x:hover {
  color: var(--color-text-primary);
}

.ai-structured {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ai-verdict-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.ai-score {
  font-family: var(--font-primary);
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
}

.score-low {
  background-color: var(--color-accent-green);
  color: var(--color-text-primary);
}

.score-medium {
  background-color: var(--color-accent-pink);
  color: var(--color-text-primary);
}

.score-high {
  background-color: #ffcccc;
  color: #8b0000;
}

.ai-verdict {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
}

.verdict-buy {
  background-color: var(--color-accent-green);
  color: var(--color-text-primary);
}

.verdict-wait {
  background-color: var(--color-accent-pink);
  color: var(--color-text-primary);
}

.verdict-skip {
  background-color: #ffcccc;
  color: #8b0000;
}

.ai-insight-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ai-label {
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-tertiary);
}

.ai-value {
  font-family: var(--font-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-primary);
}

.ai-advice {
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.ai-text {
  font-family: var(--font-secondary);
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--color-text-primary);
  margin: 0;
  white-space: pre-wrap;
}

.ai-dismiss {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-family: var(--font-primary);
  font-size: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.ai-dismiss:hover {
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
}

.community-stats {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 2px solid var(--color-border);
}

.locked-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.25rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(250, 250, 250, 0.5) 100%
  );
  border-radius: 10px;
  border: 2px dashed var(--color-border);
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
  padding: 0.5rem 1rem;
  border-radius: 16px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 0.625rem;
  border: 2px solid var(--color-border);
  font-family: var(--font-primary);
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.stat-badge.high-approval {
  background: linear-gradient(
    135deg,
    var(--color-accent-green) 0%,
    #7dda89 100%
  );
  color: var(--color-text-primary);
  border-color: var(--color-accent-green);
}

.stat-badge.medium-approval {
  background: linear-gradient(
    135deg,
    var(--color-accent-pink) 0%,
    #ffa8d8 100%
  );
  color: var(--color-text-primary);
  border-color: var(--color-accent-pink);
}

.stat-badge.low-approval {
  background: linear-gradient(
    135deg,
    var(--color-accent-pink) 0%,
    #ff9999 100%
  );
  color: var(--color-text-primary);
  border-color: var(--color-accent-red);
}

.stat-info {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  font-family: var(--font-secondary);
}

@media (max-width: 768px) {
  .wishlist-item {
    flex-direction: column;
    padding: 1.25rem;
  }

  .item-image {
    width: 100%;
    height: 220px;
    margin-bottom: 0.5rem;
  }

  .remove-button {
    top: 0.875rem;
    right: 0.875rem;
    opacity: 1;
  }

  .purchased-button,
  .purchased-label {
    top: 0.875rem;
    right: 3.25rem;
    font-size: 0.65rem;
    padding: 0.5rem 0.875rem;
  }

  .item-name {
    font-size: 1rem;
  }

  .item-price {
    font-size: 1.125rem;
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
