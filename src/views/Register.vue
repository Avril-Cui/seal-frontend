<template>
  <div class="register-container">
    <div class="register-content">
      <div class="mascot">
        <img src="../assets/pig_sprite.png" alt="Pig mascot" class="pig" />
      </div>
      <h1 class="app-title">BYEBUY</h1>

      <form @submit.prevent="handleRegister" class="register-form">
        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-group">
          <input type="text" v-model="name" placeholder="name" required />
        </div>

        <div class="form-group">
          <input type="email" v-model="email" placeholder="email" required />
        </div>

        <div class="form-group">
          <input
            type="password"
            v-model="password"
            placeholder="password"
            required
          />
        </div>

        <button type="submit" class="register-button" :disabled="isLoading">
          {{ isLoading ? "REGISTERING..." : "REGISTER" }}
        </button>
      </form>

      <div class="login-link">
        <a href="#" @click.prevent="goToLogin"
          >Already have an account? Login</a
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { register } = useAuth();
const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const handleRegister = async () => {
  error.value = "";
  isLoading.value = true;

  try {
    const result = await register(email.value, password.value);

    if (result.success) {
      router.push("/register/interests");
    } else {
      // Provide more helpful error messages
      if (result.error === "Email already registered.") {
        error.value =
          "This email is already registered. Please log in or use a different email.";
      } else {
        error.value = result.error || "Registration failed. Please try again.";
      }
    }
  } catch (err) {
    error.value =
      "Unable to connect to the server. Please check your connection and try again.";
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Poppins:wght@700;800;900&display=swap");

.register-container {
  --font-primary: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: "Nunito", -apple-system, BlinkMacSystemFont, sans-serif;

  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-secondary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.register-content {
  width: 100%;
  max-width: 400px;
  position: relative;
}

.app-title {
  font-family: "Poppins", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 3rem;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  width: 100%;
}

.form-group input {
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

.form-group input::placeholder {
  color: var(--color-text-tertiary);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-border-dark);
}

.register-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  margin-top: 1rem;
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

.register-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.register-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.login-link {
  text-align: center;
  margin-top: 2rem;
}

.login-link a {
  text-decoration: underline;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-family: var(--font-secondary);
  transition: color 0.2s ease;
}

.login-link a:hover {
  color: var(--color-text-primary);
}

.mascot {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.pig {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

@media (max-width: 768px) {
  .app-title {
    font-size: 1.5rem;
  }
}
</style>
