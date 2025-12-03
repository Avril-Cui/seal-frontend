// Configuration - change this URL when deploying to production
// const API_URL = "http://localhost:8000";
const API_URL = "https://seal-backend-to6f.onrender.com";

// Background service worker to handle API calls (bypasses CORS)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "login") {
    fetch(`${API_URL}/api/UserAuth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: request.email,
        password: request.password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.user && data.session) {
          // Store user info and session token
          chrome.storage.local.set({
            user: data.user,
            session: data.session,
          });
          sendResponse({
            success: true,
            user: data.user,
            session: data.session,
          });
        } else {
          sendResponse({ success: false, error: data.error || "Login failed" });
        }
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === "logout") {
    chrome.storage.local.get("session", (result) => {
      if (result.session) {
        fetch(`${API_URL}/api/Sessioning/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: result.session }),
        }).finally(() => {
          chrome.storage.local.remove(["user", "session"]);
          sendResponse({ success: true });
        });
      } else {
        chrome.storage.local.remove(["user", "session"]);
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if (request.action === "getUser") {
    chrome.storage.local.get(["user", "session"], (result) => {
      sendResponse({
        user: result.user || null,
        session: result.session || null,
      });
    });
    return true;
  }

  if (request.action === "addToWishlist") {
    chrome.storage.local.get("session", (result) => {
      const payload = {
        ...request.payload,
        session: result.session,
      };

      fetch(`${API_URL}/api/ItemCollection/addItemFromExtension`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
    });
    return true;
  }
});
