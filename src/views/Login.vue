<template>
  <div class="login-container">
    <div class="login-content">
      <div class="mascot">
        <img src="../assets/pig_sprite.png" alt="Pig mascot" class="pig" />
      </div>
      <h1 class="app-title">BYEBUY</h1>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="error-message">{{ error }}</div>

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

        <button type="submit" class="login-button" :disabled="isLoading">
          {{ isLoading ? "LOGGING IN..." : "LOGIN" }}
        </button>
      </form>

      <div class="register-link">
        <a href="#" @click.prevent="goToRegister"
          >Don't have an account? Register</a
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
const { login } = useAuth();
const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = "";
  isLoading.value = true;

  try {
    const result = await login(email.value, password.value);

    if (result.success) {
      router.push("/swipe");
    } else {
      // Provide more helpful error messages
      if (result.error === "Invalid credentials.") {
        error.value =
          "The email or password you entered is incorrect. Please try again.";
      } else {
        error.value = result.error || "Login failed. Please try again.";
      }
    }
  } catch (err) {
    error.value =
      "Unable to connect to the server. Please check your connection and try again.";
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  router.push("/register");
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap");

.login-container {
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

.login-content {
  width: 100%;
  max-width: 400px;
  position: relative;
}

.app-title {
  font-family: var(--font-primary);
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  letter-spacing: 0.05em;
  color: var(--color-text-primary);
}

.login-form {
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

.login-button {
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

.login-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
}

.login-button:disabled {
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

.register-link {
  text-align: center;
  margin-top: 2rem;
}

.register-link a {
  text-decoration: underline;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-family: var(--font-secondary);
  transition: color 0.2s ease;
}

.register-link a:hover {
  color: var(--color-text-primary);
}

.skip-link {
  text-align: center;
  margin-top: 1rem;
}

.skip-link a {
  text-decoration: underline;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  font-family: var(--font-secondary);
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
