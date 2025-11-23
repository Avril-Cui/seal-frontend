<template>
  <div class="wishlist-container">
    <nav class="navbar">
      <div class="nav-left">
        <h1 class="nav-title">BYEBUY</h1>
      </div>
      <div class="nav-right">
        <button @click="goToSwipe" class="nav-link">SWIPE</button>
        <button @click="goToWishlist" class="nav-link active">WISHLIST</button>
        <button @click="goToStats" class="nav-link">STATS</button>
        <button @click="goToSettings" class="nav-link settings-icon">⚙</button>
      </div>
    </nav>

    <div class="wishlist-content">
      <div class="add-item-section">
        <input
          type="text"
          v-model="newItemLink"
          placeholder="Click"
          class="link-input"
        />
        <button @click="showAddModal = true" class="add-button">ADD</button>
      </div>

      <div class="items-list">
        <div v-for="item in wishlistItems" :key="item.id" class="wishlist-item">
          <div class="item-image">
            <div class="image-placeholder">PIC</div>
          </div>
          <div class="item-details">
            <h3 class="item-name">{{ item.name }}</h3>
            <p class="item-desc">{{ item.desc }}</p>
            <div class="approval-badge" :class="item.approvalClass">
              {{ item.approval }}% approve!
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Item Modal -->
    <div
      v-if="showAddModal"
      class="modal-overlay"
      @click="showAddModal = false"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add Item</h2>
          <button @click="showAddModal = false" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-image">
            <div class="image-placeholder">PIC</div>
          </div>
          <input
            v-model="newItemName"
            placeholder="item name"
            class="modal-input"
          />
          <input v-model="newItemDesc" placeholder="desc" class="modal-input" />
          <input v-model="newItemQ1" placeholder="Q1" class="modal-input" />
          <input v-model="newItemQ2" placeholder="Q2" class="modal-input" />
          <button @click="addItem" class="modal-submit">ADD ITEM</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const showAddModal = ref(false);
const newItemLink = ref("");
const newItemName = ref("");
const newItemDesc = ref("");
const newItemQ1 = ref("");
const newItemQ2 = ref("");

const wishlistItems = ref([
  {
    id: 1,
    name: "Item name",
    desc: "desc",
    approval: 75,
    approvalClass: "high-approval",
  },
  {
    id: 2,
    name: "Another item",
    desc: "Another description",
    approval: 25,
    approvalClass: "low-approval",
  },
]);

const addItem = () => {
  if (newItemName.value) {
    wishlistItems.value.push({
      id: wishlistItems.value.length + 1,
      name: newItemName.value,
      desc: newItemDesc.value,
      approval: Math.floor(Math.random() * 100),
      approvalClass: Math.random() > 0.5 ? "high-approval" : "low-approval",
    });
    newItemName.value = "";
    newItemDesc.value = "";
    newItemQ1.value = "";
    newItemQ2.value = "";
    newItemLink.value = "";
    showAddModal.value = false;
  }
};

const goToSwipe = () => {
  router.push("/swipe");
};

const goToStats = () => {
  router.push("/stats");
};

const goToSettings = () => {
  router.push("/settings");
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
  gap: 1rem;
  margin-bottom: 2rem;
}

.link-input {
  flex: 1;
}

.add-button {
  padding: 0.75rem 2rem;
  white-space: nowrap;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.wishlist-item {
  display: flex;
  gap: 1.5rem;
  border: 2px solid #2d0000;
  border-radius: 12px;
  padding: 1.5rem;
  background-color: #f5f0e1;
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
}

.modal-submit {
  width: 100%;
  margin-top: 1rem;
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
