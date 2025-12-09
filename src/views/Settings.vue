<template>
  <div class="settings-container">
    <Navbar />

    <div class="settings-content">
      <div class="settings-grid">
        <div class="settings-column-left">
          <h2 class="column-header">PROFILE</h2>
          <div class="profile-section">
            <div class="profile-picture-container">
              <div class="profile-picture">
                <img
                  src="../assets/pig_pfp.png"
                  alt="Profile picture"
                  class="avatar-image"
                />
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

              <div class="detail-item detail-item-with-border">
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
            </div>
          </div>

          <div class="logout-section">
            <button @click="handleLogout" class="logout-button">LOGOUT</button>
          </div>
        </div>

        <div class="settings-column-right">
          <h2 class="column-header">PREFERENCES</h2>
          <div class="accessibility-section">
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
              <button
                @click="goToEditInterests"
                class="interest-tag edit-button"
              >
                ✎ EDIT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FAQButton :faqs="settingsFAQs" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useColors } from "../composables/useColors";
import { useAuth } from "../composables/useAuth";
import Navbar from "../components/Navbar.vue";
import FAQButton from "../components/FAQButton.vue";

const router = useRouter();
const { colorBlindMode, toggleColorBlindMode } = useColors();
const { logout, currentUser, getSession } = useAuth();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const settingsFAQs = [
  {
    question: "What is Color Blind Mode?",
    answer: "Color Blind Mode adjusts the app's color scheme to be more accessible for users with color vision deficiencies. Toggle it on to see a more distinguishable color palette."
  },
  {
    question: "How do I change my interests?",
    answer: "Your interests help customize your SwipeSense queue. Click 'Edit' next to your interests to update what types of items you're interested in seeing."
  },
  {
    question: "What happens when I logout?",
    answer: "Logging out will clear your session and return you to the login screen. Your data is saved and will be available when you log back in."
  },
  {
    question: "How do I update my profile?",
    answer: "You can update your name and preferences in the Settings page. Your profile information helps personalize your experience across the app."
  }
];

// Create a local ref that syncs with the composable
const isColorBlindMode = computed({
  get: () => colorBlindMode.value,
  set: (value) => {
    if (value !== colorBlindMode.value) {
      toggleColorBlindMode();
    }
  },
});

// User data - use stored name from registration/login
const userName = ref(currentUser.value?.name || "");
const userEmail = ref(currentUser.value?.email || "");

// Fetch user profile from backend on mount
const fetchUserProfile = async () => {
  const session = getSession();
  if (!session) return;

  try {
    const response = await fetch(`${API_BASE_URL}/UserProfile/_getProfile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });

    const data = await response.json();

    // Handle both array format [{ profile }] and object format { profile }
    let profile = null;
    if (Array.isArray(data) && data.length > 0) {
      profile = data[0].profile || data[0];
    } else if (data.profile) {
      profile = data.profile;
    } else if (data.name !== undefined) {
      profile = data;
    }

    if (profile) {
      // Update name if we got one from backend
      if (profile.name) {
        userName.value = profile.name;
      }
      if (profile.email) {
        userEmail.value = profile.email;
      }

      // Update interests
      if (profile.fieldOfInterests || profile.interests) {
        updateInterests(profile.fieldOfInterests || profile.interests);
      }

      // Update localStorage with fetched data
      if (currentUser.value) {
        if (profile.name) currentUser.value.name = profile.name;
        localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
      }
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
};

onMounted(() => {
  fetchUserProfile();
});
const isEditingName = ref(false);
const isEditingEmail = ref(false);

const saveName = async () => {
  isEditingName.value = false;
  const session = getSession();
  if (session && userName.value) {
    try {
      await fetch(`${API_BASE_URL}/UserProfile/updateProfileName`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, name: userName.value }),
      });
      // Update local storage
      if (currentUser.value) {
        currentUser.value.name = userName.value;
        localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
      }
    } catch (error) {
      console.error("Error saving name:", error);
    }
  }
};

const saveEmail = () => {
  isEditingEmail.value = false;
  // Email is part of UserAuth, not easily editable - just update locally for display
  if (currentUser.value) {
    currentUser.value.email = userEmail.value;
    localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
  }
};

const handleLogout = async () => {
  await logout();
  router.push("/login");
};

const fieldsOfInterest = ref([]);

// Update interests from profile data
const updateInterests = (interests) => {
  if (!interests || interests.length === 0) {
    fieldsOfInterest.value = [];
    return;
  }

  // If interests are already strings (like "TECH"), use them directly
  if (typeof interests[0] === "string") {
    fieldsOfInterest.value = interests.map((i) => i.toUpperCase());
    return;
  }

  // If interests are IDs, map them
  const interestMap = {
    1: "TECH",
    2: "MUSIC",
    3: "FASHION",
    4: "ART",
    5: "FOOD",
    6: "FITNESS",
  };
  fieldsOfInterest.value = interests
    .map((id) => interestMap[id] || "")
    .filter(Boolean);
};

const goToEditInterests = () => {
  router.push("/register/interests?from=settings");
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap");

.settings-container {
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

.settings-content {
  flex: 1;
  padding: 2rem 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

.settings-column-left,
.settings-column-right {
  display: flex;
  flex-direction: column;
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
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.detail-item-with-border {
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

.accessibility-section {
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
  padding-top: 2rem;
  padding-bottom: 2rem;
  margin-top: auto;
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
  margin-top: 0;
}

.interests-section .section-title {
  margin-bottom: 1rem;
}

.column-header {
  font-family: var(--font-primary);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
  color: var(--color-text-primary);
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
