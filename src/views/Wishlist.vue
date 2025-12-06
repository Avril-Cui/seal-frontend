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
        <button @click="openAddModal" class="add-item-button">
          ＋ Add Item
        </button>
      </div>

      <!-- Filter and Sort Controls -->
      <div
        v-if="!isLoading && wishlistItems.length > 0"
        class="filter-controls"
      >
        <div class="filter-group">
          <label class="filter-label">Sort by:</label>
          <div class="custom-select-wrapper">
            <select
              v-model="sortBy"
              class="filter-select"
              @change="saveFilters"
            >
              <option value="date-recent">Date Added (Recent)</option>
              <option value="date-oldest">Date Added (Oldest)</option>
              <option value="price-low">Price (Low to High)</option>
              <option value="price-high">Price (High to Low)</option>
            </select>
          </div>
        </div>
        <div class="filter-group">
          <button
            @click="togglePurchased"
            :class="['filter-toggle-btn', { active: showPurchased }]"
          >
            {{ showPurchased ? "Hide" : "Show" }} Purchased
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="loading-message">Loading your items...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>
      <div
        v-else-if="filteredAndSortedItems.length === 0"
        class="empty-message"
      >
        Your pause cart is empty. Click the "ADD ITEM" button above to get
        started!
      </div>
      <div v-else class="items-list">
        <div
          v-for="item in filteredAndSortedItems"
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
            <div class="item-name-row">
              <h3 class="item-name">{{ item.itemName }}</h3>
              <!-- Purchased badge (only when purchased) -->
              <div v-if="item.wasPurchased" class="purchased-badge">
                PURCHASED
              </div>
            </div>
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
            <div v-if="item.aiInsight" class="ai-insight-section">
              <div class="ai-insight-content">
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
                  <div class="ai-top-row">
                    <div class="ai-score-block">
                      <div class="ai-score-label">Impulse score</div>
                      <div class="ai-score-bar-wrapper">
                        <div class="ai-score-bar-bg">
                          <div
                            class="ai-score-bar-fill"
                            :style="{
                              width: item.aiStructured.impulseScore * 10 + '%',
                              backgroundColor: getScoreColor(
                                item.aiStructured.impulseScore
                              ),
                            }"
                          ></div>
                        </div>
                        <div class="ai-score-text">
                          {{ item.aiStructured.impulseScore }}/10 ·
                          <span class="ai-score-level">
                            {{
                              scoreLevelLabel(item.aiStructured.impulseScore)
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="ai-insight-item">
                    <span class="ai-label">Insight:</span>
                    <span class="ai-value">{{
                      item.aiStructured.keyInsight
                    }}</span>
                  </div>

                  <div class="ai-insight-item">
                    <span class="ai-label">Fact:</span>
                    <span class="ai-value">{{ item.aiStructured.fact }}</span>
                  </div>

                  <div class="ai-insight-item ai-advice">
                    <span class="ai-label">Advice:</span>
                    <span class="ai-value">{{ item.aiStructured.advice }}</span>
                  </div>
                </div>

                <!-- Fallback plain text -->
                <p v-else class="ai-text">{{ item.aiInsight }}</p>
              </div>
            </div>

            <!-- Community Insights Section -->
            <div class="community-stats">
              <div v-if="!hasCompletedQueue" class="locked-stats">
                <div class="lock-icon">🔒</div>
                <p class="locked-text">
                  Complete your daily queue to see community insights for your
                  items
                </p>
              </div>
              <div v-else-if="item.communityStats" class="unlocked-stats">
                <div class="community-header">
                  <span>👥 Community Insights</span>
                </div>
                <div class="community-metrics">
                  <div class="community-metric">
                    <span class="metric-label">Total Votes:</span>
                    <span class="metric-value">{{
                      item.communityStats.total
                    }}</span>
                  </div>
                  <div class="community-metric">
                    <span class="metric-label">Approval Rate:</span>
                    <span class="metric-value">
                      {{
                        item.communityStats.total > 0
                          ? Math.round(
                              (item.communityStats.approval /
                                item.communityStats.total) *
                                100
                            )
                          : 0
                      }}%
                    </span>
                  </div>
                </div>
              </div>
              <div v-else-if="hasCompletedQueue" class="no-stats-message">
                <p class="no-stats-text">
                  No community feedback yet for this item
                </p>
              </div>
            </div>
          </div>

          <!-- Actions Row at Bottom -->
          <div class="item-actions">
            <div v-if="item.isLoadingAI" class="ai-loading">
              <span class="loading-spinner">⏳</span> Analyzing purchase...
            </div>
            <button
              v-else-if="!item.aiInsight"
              @click.stop="getAIInsight(item)"
              class="action-button ai-action"
            >
              Get AI Insight
            </button>
            <button
              v-if="!item.wasPurchased"
              @click.stop="openPurchaseModal(item)"
              class="action-button purchase-action"
            >
              Mark as Purchased
            </button>
            <button
              v-if="item.wasPurchased"
              @click.stop="undoPurchase(item)"
              class="action-button undo-action"
            >
              Undo Purchase
            </button>
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
                  (!newItemPhoto ||
                    !newItemPhoto.trim() ||
                    !isValidImageUrl(newItemPhoto)),
              }"
            />

            <!-- empty field error -->
            <p
              v-if="
                submissionAttempted && (!newItemPhoto || !newItemPhoto.trim())
              "
              class="price-warning"
            >
              ⚠️ Image URL is required
            </p>

            <!-- looks like a non-image URL -->
            <p
              v-else-if="
                submissionAttempted &&
                newItemPhoto &&
                !isValidImageUrl(newItemPhoto)
              "
              class="price-warning"
            >
              ⚠️ This doesn’t look like an image URL (try a link ending in .jpg,
              .png, etc.)
            </p>

            <!-- only show preview box when URL looks like an image -->
            <div v-if="isValidImageUrl(newItemPhoto)" class="modal-image">
              <img :src="newItemPhoto" :alt="newItemName" class="modal-photo" />
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
              <select
                v-model="isNeedAnswer"
                class="modal-input modal-select"
                :class="{
                  'input-error':
                    submissionAttempted &&
                    (!isNeedAnswer || !isNeedAnswer.trim()),
                }"
              >
                <option value="">Select...</option>
                <option value="Need">Need</option>
                <option value="Want">Want</option>
              </select>
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
              <select
                v-model="futureApproveAnswer"
                class="modal-input modal-select"
                :class="{
                  'input-error':
                    submissionAttempted &&
                    (!futureApproveAnswer || !futureApproveAnswer.trim()),
                }"
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Maybe">Maybe</option>
              </select>
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
import { useColors } from "../composables/useColors";
import Navbar from "../components/Navbar.vue";

const router = useRouter();
const { currentUser, getSession } = useAuth();
const { palette } = useColors();

// Extract colors from palette for use in CSS
const paletteRed = computed(() => palette.value.red);
const paletteGreen = computed(() => palette.value.green);

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
  const hasPhotoError =
    !newItemPhoto.value ||
    !newItemPhoto.value.trim() ||
    !isValidImageUrl(newItemPhoto.value);
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

// Filter and sort state
const sortBy = ref("date-recent");
const showPurchased = ref(true);

// Load filters from localStorage
const loadFilters = () => {
  const savedSortBy = localStorage.getItem("wishlistSortBy");
  const savedShowPurchased = localStorage.getItem("wishlistShowPurchased");

  if (savedSortBy) {
    sortBy.value = savedSortBy;
  }
  if (savedShowPurchased !== null) {
    showPurchased.value = savedShowPurchased === "true";
  }
};

// Save filters to localStorage
const saveFilters = () => {
  localStorage.setItem("wishlistSortBy", sortBy.value);
  localStorage.setItem("wishlistShowPurchased", showPurchased.value.toString());
};

// Toggle purchased items visibility
const togglePurchased = () => {
  showPurchased.value = !showPurchased.value;
  saveFilters();
};

// Computed property for filtered and sorted items
const filteredAndSortedItems = computed(() => {
  let items = [...wishlistItems.value];

  // Filter out purchased items if needed
  if (!showPurchased.value) {
    items = items.filter((item) => !item.wasPurchased);
  }

  // Sort items based on selected option
  items.sort((a, b) => {
    switch (sortBy.value) {
      case "price-low":
        return (a.price || 0) - (b.price || 0);
      case "price-high":
        return (b.price || 0) - (a.price || 0);
      case "date-oldest":
        // Oldest first - smaller _id means older
        const aIdOld = a._id || a.id || "";
        const bIdOld = b._id || b.id || "";
        if (aIdOld < bIdOld) return -1;
        if (aIdOld > bIdOld) return 1;
        return 0;
      case "date-recent":
      default:
        // Most recent first - larger _id means newer
        const aId = a._id || a.id || "";
        const bId = b._id || b.id || "";
        if (aId > bId) return -1;
        if (aId < bId) return 1;
        return 0;
    }
  });

  return items;
});

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
      items = data.items
        .filter((obj) => obj != null) // Filter out null/undefined items
        .map((obj) => {
          const extracted = obj.item ? obj.item : obj;
          console.log("Extracted item from obj:", extracted);
          console.log("Extracted item._id:", extracted._id);
          console.log(
            "Extracted item.communityStats:",
            extracted.communityStats
          );
          return extracted;
        });
    } else if (Array.isArray(data)) {
      // Format: [{item: {...}}, ...] or [{...}, ...]
      console.log("Found direct array with length:", data.length);
      items = data
        .filter((obj) => obj != null) // Filter out null/undefined items
        .map((obj) => (obj.item ? obj.item : obj));
    } else {
      console.log("Unexpected format, keys:", Object.keys(data));
      wishlistItems.value = [];
      return;
    }

    // Extract hasCompletedQueue from response if available
    if (data.hasCompletedQueue !== undefined) {
      hasCompletedQueue.value = data.hasCompletedQueue;
      console.log("hasCompletedQueue from response:", data.hasCompletedQueue);
    } else {
      console.log("hasCompletedQueue not found in response");
    }

    // Sort items: unpurchased first, then purchased
    items.sort((a, b) => {
      const aPurchased = a.wasPurchased || false;
      const bPurchased = b.wasPurchased || false;

      // First, sort by purchased status (unpurchased first)
      if (aPurchased !== bPurchased) {
        return aPurchased ? 1 : -1;
      }

      // Within the same purchased status, sort by most recently added (using _id timestamp)
      // MongoDB ObjectIds contain a timestamp - newer items have "larger" _ids
      const aId = a._id || a.id || "";
      const bId = b._id || b.id || "";

      // Compare as strings (ObjectIds are sortable as strings)
      if (aId > bId) return -1; // a is more recent
      if (aId < bId) return 1; // b is more recent
      return 0;
    });
    wishlistItems.value = items;
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

const isValidImageUrl = (url) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(url.trim());
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
    amazonUrl: amazonUrl.value || null, // Always include amazonUrl (null if not provided)
  };

  console.log("Payload:", payload);

  try {
    // Call the new addItem endpoint with all item details
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      response = await fetch(`${API_BASE_URL}/ItemCollection/addItem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        addItemError.value =
          "Request timed out. The server may be slow or unavailable. Please try again.";
        return;
      }
      throw fetchError;
    }

    console.log("Response status:", response.status);

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      if (response.status === 504) {
        addItemError.value =
          "Request timed out on the server. Please try again.";
        return;
      }
      addItemError.value = `Server error (${response.status}). Please try again.`;
      return;
    }

    const data = await response.json();
    console.log("Response data:", data);

    if (data.error) {
      addItemError.value =
        data.error || "Failed to save item. Please try again.";
      return;
    }

    // Verify we got an item in the response
    if (!data.item) {
      console.error("Unexpected response format:", data);
      addItemError.value = "Unexpected response from server. Please try again.";
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

    const response = await fetch(
      `${API_BASE_URL}/ItemCollection/setPurchased`,
      {
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
      }
    );

    const data = await response.json();

    if (data.error) {
      purchaseError.value = data.error || "Failed to mark item as purchased.";
      return;
    }

    // Success! Update the local item state instead of reloading
    const itemIndex = wishlistItems.value.findIndex(
      (i) => i._id === purchasingItem.value._id
    );
    if (itemIndex !== -1) {
      wishlistItems.value[itemIndex].wasPurchased = true;
      wishlistItems.value[itemIndex].actualPrice = parseFloat(
        purchasePrice.value
      );
      wishlistItems.value[itemIndex].quantity = purchaseQuantity.value;
      wishlistItems.value[itemIndex].PurchasedTime = new Date(
        purchaseDate.value
      ).getTime();
    }

    // Close modal
    closePurchaseModal();
  } catch (err) {
    purchaseError.value = "Failed to mark item as purchased. Please try again.";
    console.error("Error marking as purchased:", err);
  } finally {
    isPurchasing.value = false;
  }
};

// Undo purchase
const undoPurchase = async (item) => {
  if (!confirm("Are you sure you want to undo this purchase?")) {
    return;
  }

  const session = getSession();
  if (!session) {
    error.value = "You must be logged in to undo purchases.";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/ItemCollection/unsetPurchased`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session,
          item: item._id,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      error.value = data.error || "Failed to undo purchase. Please try again.";
      return;
    }

    // Success! Update the local item state instead of reloading
    const itemIndex = wishlistItems.value.findIndex((i) => i._id === item._id);
    if (itemIndex !== -1) {
      wishlistItems.value[itemIndex].wasPurchased = false;
      // Optionally clear purchase-related fields
      wishlistItems.value[itemIndex].actualPrice = undefined;
      wishlistItems.value[itemIndex].quantity = undefined;
      wishlistItems.value[itemIndex].PurchasedTime = undefined;
    }
  } catch (err) {
    error.value = "Failed to undo purchase. Please try again.";
    console.error("Error undoing purchase:", err);
  }
};

onMounted(async () => {
  loadFilters();
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
const scoreLevelLabel = (score) => {
  if (score <= 3) return "Low impulse (good)";
  if (score <= 6) return "Medium impulse (be mindful)";
  return "High impulse (risky)";
};

const getScoreClass = (score) => {
  if (score <= 3) return "score-low";
  if (score <= 6) return "score-medium";
  return "score-high";
};

const getScoreColor = (score) => {
  if (score <= 3) return "#22c55e"; // green
  if (score <= 6) return "#eab308"; // yellow
  return "#ef4444"; // red
};

const getVerdictClass = (verdict) => {
  if (!verdict) return "";
  const v = verdict.toUpperCase();
  if (v === "BUY") return "verdict-buy";
  if (v === "WAIT") return "verdict-wait";
  return "verdict-skip";
};

// Community stats are now automatically fetched by the backend
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
  margin: 1.5rem 0 2.5rem;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.custom-select-wrapper {
  position: relative;
  display: inline-block;
}

.custom-select-wrapper::after {
  content: "▼";
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
}

.custom-select-wrapper:hover::after {
  color: var(--color-text-primary);
}

.filter-select {
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: 6px;
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 200px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: none;
}

.filter-select:hover {
  border-color: var(--color-border-dark);
  background-color: var(--color-bg-secondary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-text-primary);
  background-color: var(--color-bg);
}

.filter-toggle-btn {
  padding: 0.5rem 1.25rem;
  border: 1.5px solid var(--color-border);
  border-radius: 6px;
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-toggle-btn:hover {
  border-color: var(--color-border-dark);
  background-color: var(--color-bg-secondary);
}

.filter-toggle-btn.active {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-dark);
}

.filter-toggle-btn.active:hover {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border-dark);
}

.add-item-button {
  padding: 1.1rem 3.25rem;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-radius: 999px;
  border: 2px solid var(--color-text-primary);
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(26, 26, 26, 0.2);
}

.add-item-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(26, 26, 26, 0.3);
}

.items-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.wishlist-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  padding-bottom: 1.5rem;
}

.wishlist-item::before {
  content: "";
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
    rgba(255, 255, 255, 1) 0%,
    rgba(250, 250, 250, 1) 100%
  );
  opacity: 0.6;
  border-color: var(--color-border);
  filter: grayscale(0.3);
}

.wishlist-item.purchased-item::before {
  display: none;
}

.wishlist-item.purchased-item:hover {
  opacity: 0.7;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
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

.purchased-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
  font-size: 0.65rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-family: var(--font-primary);
  border: 1px solid rgba(76, 175, 80, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.item-image {
  width: 100%;
  height: 200px;
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

.item-name-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.item-name {
  font-family: var(--font-primary);
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
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
  border-radius: 16px;
  max-width: 840px; /* was 500px */
  width: min(96vw, 840px); /* let it stretch with screen */
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(26, 26, 26, 0.3);
}

/* Purchase modal should also be wider */
.purchase-modal {
  max-width: 640px; /* was 500px */
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

@media (min-width: 768px) {
  .modal-body {
    padding: 2rem 2.25rem 1.75rem;
    gap: 1.25rem;
  }
}

.modal-image {
  width: 180px; /* small preview instead of full width */
  height: 180px;
  margin-top: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-secondary);
  overflow: hidden;
  align-self: flex-start; /* don't stretch horizontally */
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

.modal-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232d0000' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px;
  padding-right: 2.5rem;
  cursor: pointer;
}

.modal-select:hover {
  border-color: var(--color-border-dark);
}

.modal-select:focus {
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
  margin-top: 2rem;
  padding: 1.5rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-secondary);
}

.reflection-section .form-group {
  margin-bottom: 1.5rem; /* extra space between questions */
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
  margin-bottom: 0.125rem;
  padding: 0.5rem 1rem;
  font-family: var(--font-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  background-color: #fff;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: fit-content;
}

.amazon-link:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  text-decoration: none;
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
}

/* Actions Row at Bottom */
.item-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--color-border);
  align-items: center;
  justify-content: center;
}

.action-button {
  padding: 0.5rem 1rem;
  font-family: var(--font-primary);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.75rem;
  white-space: nowrap;
  min-width: 0;
  max-width: 100%;
}

.action-button.ai-action {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-text-primary);
  font-weight: 600;
}

.action-button.ai-action:hover {
  background-color: rgba(26, 26, 26, 0.05);
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
}

.action-button.purchase-action {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-text-primary);
  font-size: 0.8rem;
  font-weight: 600;
}

.action-button.purchase-action:hover {
  background-color: rgba(26, 26, 26, 0.05);
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
}

.action-button.undo-action {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  border: 1.5px solid var(--color-border);
  font-weight: 600;
}

.action-button.undo-action:hover {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border-dark);
  color: var(--color-text-primary);
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
  gap: 0.5rem;
}

.ai-top-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.ai-score-block {
  flex: 1;
}

.ai-score-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  font-family: var(--font-primary);
  font-weight: 600;
}

.ai-score-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.25rem;
}

.ai-score-bar-bg {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #f1f1f1;
  overflow: hidden;
}

.ai-score-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.ai-score-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-family: var(--font-secondary);
}

.ai-score-level {
  font-weight: 600;
}

.ai-insight-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ai-label {
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-tertiary);
  margin-bottom: 0.1rem;
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
}

.locked-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.unlocked-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.community-header {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.community-metrics {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.community-metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-family: var(--font-primary);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.metric-value {
  font-family: var(--font-primary);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.community-comments {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.comments-label {
  font-family: var(--font-primary);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.comment-item {
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-primary);
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: var(--color-bg-secondary);
  border-radius: 6px;
  border-left: 3px solid var(--color-accent-green);
}

.no-stats-message {
  padding: 0.75rem;
  text-align: center;
}

.no-stats-text {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  margin: 0;
  font-style: italic;
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
  .items-list {
    grid-template-columns: 1fr;
  }

  .wishlist-item {
    padding: 1.25rem;
  }

  .item-image {
    height: 220px;
  }

  .remove-button {
    top: 0.875rem;
    right: 0.875rem;
    opacity: 1;
  }

  .purchased-badge {
    padding: 0.4rem 0.75rem;
    font-size: 0.7rem;
  }

  .item-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-button {
    width: 100%;
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
