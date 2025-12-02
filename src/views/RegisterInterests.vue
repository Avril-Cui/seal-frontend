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
const { currentUser, completeRegistration, getSession } = useAuth();
const selectedInterests = ref([]);
const isEditing = ref(false);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

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

const handleContinue = async () => {
  const session = getSession();
  
  // Save interests to backend if we have a session
  if (session) {
    try {
      await fetch(`${API_BASE_URL}/UserProfile/updateInterests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, interests: selectedInterests.value }),
      });
    } catch (error) {
      console.error("Error saving interests:", error);
    }
  }

  if (isEditing.value) {
    // Update existing user's interests locally
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
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap");

.interests-container {
  --font-primary: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif;

  min-height: 100vh;
  padding: 2rem;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.interests-content {
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 3rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.interests-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.interest-card {
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 1rem;
  background-color: var(--color-bg);
}

.interest-card:hover {
  border-color: var(--color-border-dark);
  box-shadow: 0 4px 20px rgba(26, 26, 26, 0.04);
  transform: translateY(-2px);
}

.interest-card.selected {
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  border-color: var(--color-text-primary);
}

.interest-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  filter: grayscale(20%);
}

.interest-name {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.continue-button {
  width: 100%;
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

.continue-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.continue-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.continue-button:disabled:hover {
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .interests-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .page-title {
    font-size: 0.7rem;
  }
}
</style>
