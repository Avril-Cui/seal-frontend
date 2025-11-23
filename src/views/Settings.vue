<template>
  <div class="settings-container">
    <nav class="navbar">
      <div class="nav-left">
        <h1 class="nav-title">BYEBUY</h1>
      </div>
      <div class="nav-right">
        <button @click="goToSwipe" class="nav-link">SWIPE</button>
        <button @click="goToWishlist" class="nav-link">WISHLIST</button>
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
            <div class="avatar-placeholder">👤</div>
          </div>
          <button class="edit-picture-button">EDIT</button>
        </div>

        <div class="user-details">
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">Name Name</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">email</span>
            <div class="detail-value-with-icon">
              <span>email@example.com</span>
              <button class="edit-icon-button">✎</button>
            </div>
          </div>

          <div class="detail-item">
            <a href="#" class="reset-password-link">reset password</a>
          </div>
        </div>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useColors } from "../composables/useColors";

const router = useRouter();
const { colorBlindMode, toggleColorBlindMode } = useColors();

// Create a local ref that syncs with the composable
const isColorBlindMode = computed({
  get: () => colorBlindMode.value,
  set: (value) => {
    if (value !== colorBlindMode.value) {
      toggleColorBlindMode();
    }
  },
});

const fieldsOfInterest = ref(["FASHION", "ART", "TECH"]);

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
.settings-container {
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

.settings-content {
  flex: 1;
  padding: 2rem;
  max-width: 600px;
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
  border: 2px solid #2d0000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f0e1;
  position: relative;
}

.avatar-placeholder {
  font-size: 4rem;
}

.edit-picture-button {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #2d0000;
  background-color: #f5f0e1;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border-bottom: 1px solid #f5f0e1;
}

.detail-label {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
}

.detail-value-with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-icon-button {
  border: none;
  background: none;
  font-size: 1.2rem;
  padding: 0.25rem;
  cursor: pointer;
}

.edit-icon-button:hover {
  background-color: transparent;
  color: #2d0000;
  text-decoration: underline;
}

.reset-password-link {
  text-decoration: underline;
  font-size: 0.95rem;
}

.accessibility-section {
  border-top: 2px solid #2d0000;
  padding-top: 2rem;
  margin-bottom: 3rem;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid #f5f0e1;
}

.toggle-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.toggle-title {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-description {
  font-size: 0.85rem;
  color: #2d0000;
  opacity: 0.7;
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
  background-color: #f5f0e1;
  border: 2px solid #2d0000;
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
  background-color: #2d0000;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #2d0000;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(26px);
  background-color: #f5f0e1;
}

.interests-section {
  border-top: 2px solid #2d0000;
  padding-top: 2rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.interests-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.interest-tag {
  padding: 0.5rem 1.25rem;
  border: 2px solid #2d0000;
  background-color: #f5f0e1;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 20px;
}

.interest-tag.etc {
  font-style: italic;
  font-weight: 400;
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
