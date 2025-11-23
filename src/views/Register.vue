<template>
  <div class="register-container">
    <div class="register-content">
      <h1 class="app-title">BYEBUY</h1>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <input type="text" v-model="name" placeholder="name" required />
        </div>

        <div class="form-group">
          <input type="email" v-model="email" placeholder="email" required />
        </div>

        <div class="form-group">
          <input type="password" v-model="password" placeholder="PW" required />
        </div>

        <button type="submit" class="register-button">REGISTER</button>
      </form>

      <div class="login-link">
        <a href="#" @click.prevent="goToLogin"
          >Already have an account? Login</a
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

const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");

const handleRegister = () => {
  // Navigate to interests selection
  router.push("/register/interests");
};

const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f5f0e1;
}

.register-content {
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
  padding: 1rem;
  border: 2px solid #2d0000;
  font-size: 1rem;
  background-color: #f5f0e1;
}

.register-button {
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.login-link {
  text-align: center;
  margin-top: 2rem;
}

.login-link a {
  text-decoration: underline;
  font-size: 0.9rem;
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
