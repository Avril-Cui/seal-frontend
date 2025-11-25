import { ref } from "vue";

// Simple auth state management
const isAuthenticated = ref(
  localStorage.getItem("isAuthenticated") === "true"
);

const currentUser = ref(
  localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : null
);

const login = (userData) => {
  isAuthenticated.value = true;
  currentUser.value = userData;
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("currentUser", JSON.stringify(userData));
};

const logout = () => {
  isAuthenticated.value = false;
  currentUser.value = null;
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("currentUser");
};

const register = (userData) => {
  // Registration just stores the user data, login happens after interests selection
  currentUser.value = userData;
  localStorage.setItem("currentUser", JSON.stringify(userData));
};

export function useAuth() {
  return {
    isAuthenticated,
    currentUser,
    login,
    logout,
    register,
  };
}
