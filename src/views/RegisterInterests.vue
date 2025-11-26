<template>
  <div class="interests-container">
    <div class="interests-content">
      <h1 class="page-title">SELECT YOUR FIELDS OF INTEREST</h1>

      <div class="interests-grid">
        <div
          v-for="interest in interests"
          :key="interest.id"
          class="interest-card"
          :class="{ selected: selectedInterests.includes(interest.id) }"
          @click="toggleInterest(interest.id)"
        >
          <div class="interest-icon">{{ interest.icon }}</div>
          <div class="interest-name">{{ interest.name }}</div>
        </div>
      </div>

      <button
        @click="handleContinue"
        class="continue-button"
        :disabled="selectedInterests.length === 0"
      >
        {{ isEditing ? "SAVE" : "CONTINUE" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const route = useRoute();
const { login, currentUser, isAuthenticated, completeRegistration } = useAuth();
const selectedInterests = ref([]);
const isEditing = ref(false);

const interests = ref([
  { id: 1, name: "TECH", icon: "💻" },
  { id: 2, name: "MUSIC", icon: "🎧" },
  { id: 3, name: "FASHION", icon: "👕" },
  { id: 4, name: "ART", icon: "🎨" },
  { id: 5, name: "FOOD", icon: "🍔" },
  { id: 6, name: "FITNESS", icon: "🏋️" },
]);

onMounted(() => {
  // Check if coming from settings (editing) - only check query parameter
  isEditing.value = route.query.from === "settings";

  // If editing, pre-select current interests
  if (isEditing.value && currentUser.value?.interests) {
    selectedInterests.value = [...currentUser.value.interests];
  }
});

const toggleInterest = (id) => {
  const index = selectedInterests.value.indexOf(id);
  if (index > -1) {
    selectedInterests.value.splice(index, 1);
  } else {
    selectedInterests.value.push(id);
  }
};

const handleContinue = () => {
  if (isEditing.value) {
    // Update existing user's interests
    if (currentUser.value) {
      currentUser.value.interests = selectedInterests.value;
      localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
    }
    router.push("/settings");
  } else {
    // Complete registration by marking user as authenticated
    if (currentUser.value) {
      currentUser.value.interests = selectedInterests.value;
      localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
      completeRegistration();
    }
    router.push("/swipe");
  }
};
</script>

<style scoped>
.interests-container {
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f0e1;
}

.interests-content {
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.interests-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.interest-card {
  aspect-ratio: 1;
  border: 2px solid #2d0000;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 1rem;
  background-color: #f5f0e1;
}

.interest-card:hover {
  background-color: #f5f0e1;
}

.interest-card.selected {
  background-color: #2d0000;
  color: #f5f0e1;
}

.interest-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.interest-name {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.continue-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.continue-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.continue-button:disabled:hover {
  background-color: #f5f0e1;
  color: #2d0000;
}

@media (max-width: 768px) {
  .interests-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .page-title {
    font-size: 1.2rem;
  }
}
</style>
