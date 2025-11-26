<template>
  <div class="login-container">
    <div class="login-content">
      <h1 class="app-title">BYEBUY</h1>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-group">
          <input type="email" v-model="email" placeholder="email" required />
        </div>

        <div class="form-group">
          <input type="password" v-model="password" placeholder="PW" required />
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

      <div class="mascot">
        <div class="pig">🐷</div>
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
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f5f0e1;
}

.login-content {
  width: 100%;
  max-width: 400px;
  position: relative;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  letter-spacing: 2px;
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
  padding: 1rem;
  border: 2px solid #2d0000;
  font-size: 1rem;
  background-color: #f5f0e1;
}

.login-button {
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem;
  background-color: #ffebee;
  border: 2px solid #ef5350;
  color: #c62828;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.register-link {
  text-align: center;
  margin-top: 2rem;
}

.register-link a {
  text-decoration: underline;
  font-size: 0.9rem;
}

.skip-link {
  text-align: center;
  margin-top: 1rem;
}

.skip-link a {
  text-decoration: underline;
  font-size: 0.9rem;
  font-weight: 600;
}

.mascot {
  position: absolute;
  right: -60px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 2rem;
}

.pig {
  font-size: 3rem;
}

@media (max-width: 768px) {
  .mascot {
    position: static;
    transform: none;
    text-align: center;
    margin-top: 2rem;
  }

  .app-title {
    font-size: 2rem;
  }
}
</style>
