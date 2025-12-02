import { ref } from "vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Simple auth state management
const isAuthenticated = ref(localStorage.getItem("isAuthenticated") === "true");

const currentUser = ref(
  localStorage.getItem("currentUser")
    ? JSON.parse(localStorage.getItem("currentUser"))
    : null
);

// Session token storage (used for authenticated API calls)
const sessionToken = ref(localStorage.getItem("sessionToken") || null);

// Helper function to get current session for API calls
const getSession = () => {
  // Always check localStorage in case it was updated
  const stored = localStorage.getItem("sessionToken");
  if (stored && stored !== sessionToken.value) {
    sessionToken.value = stored;
  }
  console.log("getSession called, returning:", sessionToken.value);
  return sessionToken.value;
};

const login = async (email, password) => {
  try {
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("Attempting login to:", `${API_BASE_URL}/UserAuth/login`);

    const response = await fetch(`${API_BASE_URL}/UserAuth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Login response data:", data);
    console.log("Login response keys:", Object.keys(data));

    if (data.error) {
      throw new Error(data.error);
    }

    // Store session token from backend
    console.log("data.session value:", data.session);
    if (data.session) {
      sessionToken.value = data.session;
      localStorage.setItem("sessionToken", data.session);
      console.log("Session token saved to localStorage:", data.session);
    } else {
      console.error("WARNING: No session token in login response!");
      console.error("Full response data:", JSON.stringify(data));
    }

    // Store user data with uid (backend uses _id)
    const userData = {
      uid: data.user._id, // Backend stores ID as _id
      email: email,
    };

    isAuthenticated.value = true;
    currentUser.value = userData;
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("currentUser", JSON.stringify(userData));

    console.log("Login completed. sessionToken.value:", sessionToken.value);
    console.log("localStorage sessionToken:", localStorage.getItem("sessionToken"));

    return { success: true, user: userData, session: data.session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const logout = async () => {
  try {
    // Call backend logout if we have a session
    if (sessionToken.value) {
      await fetch(`${API_BASE_URL}/Sessioning/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session: sessionToken.value }),
      });
    }
  } catch (error) {
    console.error("Error during logout:", error);
  } finally {
    // Clear local state regardless of backend response
    isAuthenticated.value = false;
    currentUser.value = null;
    sessionToken.value = null;
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("sessionToken");
  }
};

const register = async (email, password, name = "") => {
  try {
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("Attempting signup to:", `${API_BASE_URL}/UserAuth/signup`);

    const response = await fetch(`${API_BASE_URL}/UserAuth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Store session token from backend
    if (data.session) {
      sessionToken.value = data.session;
      localStorage.setItem("sessionToken", data.session);
    }

    // Store user data temporarily (will be authenticated after interests selection)
    const userData = {
      uid: data.user._id, // Backend stores ID as _id
      email: email,
      name: name, // Store the name
    };

    currentUser.value = userData;
    localStorage.setItem("currentUser", JSON.stringify(userData));

    // Save name to backend profile
    if (name && data.session) {
      try {
        await fetch(`${API_BASE_URL}/UserProfile/updateProfileName`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: data.session, name: name }),
        });
      } catch (e) {
        console.error("Error saving name to profile:", e);
      }
    }

    return { success: true, user: userData, session: data.session };
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
    sessionToken,
    login,
    logout,
    register,
    completeRegistration,
    getSession,
  };
}
