<template>
  <div class="settings-container">
    <nav class="navbar">
      <div class="nav-left">
        <h1 class="nav-title">BYEBUY</h1>
      </div>
      <div class="nav-right">
        <button @click="goToSwipe" class="nav-link">SWIPESENSE</button>
        <button @click="goToWishlist" class="nav-link">PAUSE CART</button>
        <button @click="goToStats" class="nav-link">STATS</button>
        <button @click="goToSettings" class="nav-link settings-icon active">
          ⚙
        </button>
      </div>
    </nav>

    <div class="settings-content">
      <div class="profile-section">
        <div class="profile-picture-container">
          <div class="profile-picture">
            <img src="../assets/pig_pfp.png" alt="Profile picture" class="avatar-image" />
          </div>
        </div>

        <div class="user-details">
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <div class="detail-value-with-icon">
              <input
                v-if="isEditingName"
                v-model="userName"
                @blur="saveName"
                @keyup.enter="saveName"
                class="edit-input"
                autofocus
              />
              <span v-else>{{ userName }}</span>
              <button
                class="edit-icon-button"
                @click="isEditingName = true"
                v-if="!isEditingName"
              >
                ✎
              </button>
            </div>
          </div>

          <div class="detail-item">
            <span class="detail-label">email</span>
            <div class="detail-value-with-icon">
              <input
                v-if="isEditingEmail"
                v-model="userEmail"
                @blur="saveEmail"
                @keyup.enter="saveEmail"
                type="email"
                class="edit-input"
                autofocus
              />
              <span v-else>{{ userEmail }}</span>
              <button
                class="edit-icon-button"
                @click="isEditingEmail = true"
                v-if="!isEditingEmail"
              >
                ✎
              </button>
            </div>
          </div>

          <div class="detail-item">
            <a href="#" class="reset-password-link">reset password</a>
          </div>
        </div>
      </div>

      <div class="logout-section">
        <button @click="handleLogout" class="logout-button">LOGOUT</button>
      </div>

      <div class="accessibility-section">
        <h2 class="section-title">ACCESSIBILITY</h2>
        <div class="toggle-item">
          <div class="toggle-label">
            <span class="toggle-title">Red-Green Color Blind Toggle</span>
            <span class="toggle-description"
              >Use color-blind friendly palette</span
            >
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="isColorBlindMode" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="interests-section">
        <h2 class="section-title">FIELDS OF INTEREST</h2>
        <div class="interests-tags">
          <span
            v-for="interest in fieldsOfInterest"
            :key="interest"
            class="interest-tag"
          >
            {{ interest }}
          </span>
          <span class="interest-tag etc">etc</span>
          <button @click="goToEditInterests" class="interest-tag edit-button">
            ✎ EDIT
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useColors } from "../composables/useColors";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { colorBlindMode, toggleColorBlindMode } = useColors();
const { logout, currentUser } = useAuth();

// Create a local ref that syncs with the composable
const isColorBlindMode = computed({
  get: () => colorBlindMode.value,
  set: (value) => {
    if (value !== colorBlindMode.value) {
      toggleColorBlindMode();
    }
  },
});

// User data
const userName = ref(currentUser.value?.name || "Name Name");
const userEmail = ref(currentUser.value?.email || "email@example.com");
const isEditingName = ref(false);
const isEditingEmail = ref(false);

const saveName = () => {
  isEditingName.value = false;
  // In a real app, you'd save this to the backend
  if (currentUser.value) {
    currentUser.value.name = userName.value;
    localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
  }
};

const saveEmail = () => {
  isEditingEmail.value = false;
  // In a real app, you'd save this to the backend
  if (currentUser.value) {
    currentUser.value.email = userEmail.value;
    localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
  }
};

const handleLogout = () => {
  logout();
  router.push("/login");
};

const fieldsOfInterest = ref(
  currentUser.value?.interests
    ? currentUser.value.interests.map((id) => {
        const interestMap = {
          1: "TECH",
          2: "MUSIC",
          3: "FASHION",
          4: "ART",
          5: "FOOD",
          6: "FITNESS",
        };
        return interestMap[id] || "";
      })
    : ["FASHION", "ART", "TECH"]
);

const goToEditInterests = () => {
  router.push("/register/interests?from=settings");
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
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

.settings-container {
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

.settings-content {
  flex: 1;
  padding: 2rem 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.profile-section {
  margin-bottom: 3rem;
}

.profile-picture-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.profile-picture {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  position: relative;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.edit-input {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-family: var(--font-secondary);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  width: 200px;
  transition: border-color 0.2s ease;
}

.edit-input:focus {
  outline: none;
  border-color: var(--color-border-dark);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-label {
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-secondary);
}

.detail-value {
  font-family: var(--font-secondary);
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.detail-value-with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-icon-button {
  border: none;
  background: none;
  font-size: 1rem;
  padding: 0.25rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.edit-icon-button:hover {
  color: var(--color-text-primary);
}

.reset-password-link {
  text-decoration: underline;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-family: var(--font-secondary);
  transition: color 0.2s ease;
}

.reset-password-link:hover {
  color: var(--color-text-primary);
}

.accessibility-section {
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
  margin-bottom: 3rem;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.toggle-title {
  font-family: var(--font-primary);
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-secondary);
}

.toggle-description {
  font-family: var(--font-secondary);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  transition: 0.3s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: var(--color-text-primary);
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-text-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(26px);
  background-color: var(--color-bg);
}

.logout-section {
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
  padding-bottom: 2rem;
  margin-top: 3rem;
  margin-bottom: 0;
}

.logout-button {
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

.logout-button:hover {
  background-color: var(--color-text-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.interests-section {
  border-top: 1px solid var(--color-border);
  padding-top: 2rem;
  margin-top: 3rem;
}

.interests-section .section-title {
  margin-bottom: 1rem;
}

.section-title {
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.interests-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.interest-tag {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  font-family: var(--font-primary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 20px;
  color: var(--color-text-primary);
  transition: all 0.2s ease;
}

.interest-tag:hover {
  border-color: var(--color-border-dark);
}

.interest-tag.etc {
  font-style: italic;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.interest-tag.edit-button {
  background-color: var(--color-text-primary);
  color: var(--color-bg);
  border: 1px solid var(--color-border);
  cursor: pointer;
  font-weight: 600;
  font-style: normal;
}

.interest-tag.edit-button:hover {
  background-color: var(--color-text-primary);
  border-color: var(--color-border-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
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
  .profile-picture {
    width: 120px;
    height: 120px;
  }

  .avatar-placeholder {
    font-size: 3rem;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
