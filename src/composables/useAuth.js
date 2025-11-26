import { ref } from "vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Simple auth state management
const isAuthenticated = ref(
  localStorage.getItem("isAuthenticated") === "true"
);

const currentUser = ref(
  localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : null
);

const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/UserAuth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Store user data with uid (backend uses _id)
    const userData = {
      uid: data.user._id,  // Backend stores ID as _id
      email: email,
    };

    isAuthenticated.value = true;
    currentUser.value = userData;
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("currentUser", JSON.stringify(userData));

    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const logout = () => {
  isAuthenticated.value = false;
  currentUser.value = null;
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("currentUser");
};

const register = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/UserAuth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Store user data temporarily (will be authenticated after interests selection)
    const userData = {
      uid: data.user._id,  // Backend stores ID as _id
      email: email,
    };

    currentUser.value = userData;
    localStorage.setItem("currentUser", JSON.stringify(userData));

    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const completeRegistration = () => {
  // Called after interests are selected to fully authenticate the user
  isAuthenticated.value = true;
  localStorage.setItem("isAuthenticated", "true");
};

export function useAuth() {
  return {
    isAuthenticated,
    currentUser,
    login,
    logout,
    register,
    completeRegistration,
  };
}
