import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    chrome.runtime.sendMessage(
      { action: "login", email, password },
      (response) => {
        setIsLoading(false);
        if (response.success) {
          onLogin(response.user);
        } else {
          setError(response.error || "Login failed");
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <div className="text-sm font-medium text-gray-800">ByeBuy Login</div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", margin: 0 }}
        className="h-9 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", margin: 0 }}
        className="h-9 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
        required
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-3 py-1.5 text-sm text-white bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

function AddToWishlistButton() {
  const [user, setUser] = useState(null);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Reflection questions
  const [reason, setReason] = useState("");
  const [isNeed, setIsNeed] = useState("");
  const [isFutureApprove, setIsFutureApprove] = useState("");

  const pigIconUrl = chrome.runtime.getURL("dist/pig_icon.png");

  useEffect(() => {
    // Check if user is already logged in
    chrome.runtime.sendMessage({ action: "getUser" }, (response) => {
      if (response?.user) setUser(response.user);
    });
  }, []);

  const handleLogout = () => {
    chrome.runtime.sendMessage({ action: "logout" }, () => {
      setUser(null);
      setShowLogin(false);
    });
  };

  const handleClick = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    setIsLoading(true);
    setIsDisabled(true);
    setError(null);

    try {
      const productData = fetchAmazonProduct();

      const payload = {
        owner: user._id,
        itemName: productData.title,
        photo: productData.mainImage,
        price: productData.price,
        description: productData.description,
        reason,
        isNeed,
        isFutureApprove,
      };

      chrome.runtime.sendMessage(
        { action: "addToWishlist", payload },
        (response) => {
          setIsLoading(false);
          if (response?.success && !response?.data?.error) {
            setIsAdded(true);
            setReason("");
            setIsNeed("");
            setIsFutureApprove("");
            setTimeout(() => {
              setIsAdded(false);
              setIsDisabled(false);
            }, 2000);
          } else {
            const errorMsg =
              response?.data?.error || response?.error || "Failed to add item";
            setError(errorMsg);
            setIsDisabled(false);
          }
        }
      );
    } catch (err) {
      setIsLoading(false);
      setError("Failed to connect to server");
      setIsDisabled(false);
    }
  };

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-[10000]">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-14 h-14 rounded-full bg-white flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
          style={{
            boxShadow:
              "0 4px 20px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <img
            src={pigIconUrl}
            alt="ByeBuy"
            className="w-10 h-10 rounded-full"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-2 right-2 z-[10000]">
      <div
        className="flex flex-col gap-3 p-4 bg-white rounded-xl w-72"
        style={{
          boxShadow:
            "0 8px 30px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Header with collapse button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={pigIconUrl}
              alt="ByeBuy"
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm font-medium text-gray-800">ByeBuy</span>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {showLogin && !user ? (
          <LoginForm
            onLogin={(u) => {
              setUser(u);
              setShowLogin(false);
            }}
          />
        ) : (
          <>
            {user && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-700">
                  Why do you want this item? *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter your reason..."
                  style={{ width: "100%", boxSizing: "border-box" }}
                  className="h-16 px-3 py-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
                />

                <label className="text-xs font-medium text-gray-700">
                  Is this a need or a want? *
                </label>
                <select
                  value={isNeed}
                  onChange={(e) => setIsNeed(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                  className="h-9 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Select...</option>
                  <option value="need">Need</option>
                  <option value="want">Want</option>
                </select>

                <label className="text-xs font-medium text-gray-700">
                  Would Future-You approve? *
                </label>
                <select
                  value={isFutureApprove}
                  onChange={(e) => setIsFutureApprove(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box" }}
                  className="h-9 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="maybe">Maybe</option>
                </select>
              </div>
            )}

            <button
              onClick={handleClick}
              className={`
                w-full px-4 py-2.5 rounded-lg
                text-white text-sm font-medium
                transition-all duration-300
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  error
                    ? "bg-red-600"
                    : isAdded
                    ? "bg-green-600"
                    : "bg-orange-600 hover:bg-orange-700"
                }
              `}
              disabled={
                isDisabled || (user && (!reason || !isNeed || !isFutureApprove))
              }
            >
              {isLoading
                ? "Adding..."
                : error
                ? "Error!"
                : isAdded
                ? "Added!"
                : user
                ? "Add to ByeBuy Wishlist"
                : "Login to Add"}
            </button>

            {error && <div className="text-xs text-red-600">{error}</div>}

            {user && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t">
                <span className="truncate">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-orange-600 hover:underline ml-2 shrink-0"
                >
                  Logout
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function fetchAmazonProduct() {
  const metadata = {};

  // Product Title
  const titleElement = document.querySelector("#productTitle, #title");
  metadata.title = titleElement ? titleElement.textContent.trim() : null;

  // Price
  const priceWhole = document.querySelector(".a-price-whole");
  const priceFraction = document.querySelector(".a-price-fraction");
  if (priceWhole) {
    metadata.price =
      priceWhole.textContent.trim() +
      (priceFraction ? priceFraction.textContent.trim() : "");
  } else {
    metadata.price = null;
  }

  // Currency symbol
  const currencySymbol = document.querySelector(".a-price-symbol");
  metadata.currency = currencySymbol ? currencySymbol.textContent.trim() : null;

  // Rating
  const ratingElement = document.querySelector(
    "span[data-hook='rating-out-of-text'], .a-icon-alt"
  );
  metadata.rating = ratingElement ? ratingElement.textContent.trim() : null;

  // Number of ratings/reviews
  const reviewCountElement = document.querySelector(
    "#acrCustomerReviewText, span[data-hook='total-review-count']"
  );
  metadata.reviewCount = reviewCountElement
    ? reviewCountElement.textContent.trim()
    : null;

  // ASIN (Amazon Standard Identification Number)
  const asinElement = document.querySelector("input[name='ASIN']");
  metadata.asin = asinElement ? asinElement.value : null;

  // Try to get ASIN from URL if not found
  if (!metadata.asin) {
    const urlMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    metadata.asin = urlMatch ? urlMatch[1] : null;
  }

  // Product description - try multiple selectors
  let description = null;

  // First try to get feature bullets (most common format)
  const bulletSelectors = [
    "#centerCol #feature-bullets ul",
    "#centerCol #feature-bullets-btf ul",
    "#centerCol [data-feature-name='featurebullets'] ul",
    "#centerCol #productFactsDesktopExpander ul.a-unordered-list.a-vertical.a-spacing-small",
    "#dp-container #feature-bullets ul",
    "#dp-container [data-feature-name='featurebullets'] ul",
  ];

  let featureBullets = null;
  for (const selector of bulletSelectors) {
    featureBullets = document.querySelector(selector);
    if (featureBullets) break;
  }

  if (featureBullets) {
    const bullets = Array.from(featureBullets.querySelectorAll("li"))
      .map((li) => li.textContent.trim())
      .filter((text) => text.length > 0);

    if (bullets.length > 0) {
      description = bullets.join("\n");
    }
  }

  // If no bullets found, try other selectors
  if (!description) {
    const descriptionSelectors = [
      "#feature-bullets",
      "#productDescription",
      "#feature-bullets-btf",
      ".a-section.a-spacing-medium.a-spacing-top-small",
      "[data-feature-name='featurebullets']",
      "#aplus",
    ];

    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        description = element.textContent.trim();
        break;
      }
    }
  }

  // Fallback to title if no description found
  if (!description && metadata.title) {
    description = metadata.title;
  }

  metadata.description = description;

  // Brand
  const brandElement = document.querySelector(
    "#bylineInfo, .po-brand .po-break-word"
  );
  metadata.brand = brandElement ? brandElement.textContent.trim() : null;

  // Images
  const images = [];
  const imageElements = document.querySelectorAll(
    "#altImages img, #imageBlock img"
  );
  imageElements.forEach((img) => {
    const src = img.src || img.dataset.src;
    if (src && !src.includes("transparent-pixel")) {
      images.push(src);
    }
  });
  metadata.images = images;

  // Main image - try multiple selectors for better compatibility
  let mainImage = null;
  const mainImageSelectors = [
    "#landingImage",
    "#imgBlkFront",
    "#main-image",
    ".a-dynamic-image",
    "#imageBlock img[data-a-dynamic-image]",
  ];

  for (const selector of mainImageSelectors) {
    const imgElement = document.querySelector(selector);
    if (imgElement) {
      const src = imgElement.src || imgElement.dataset.src;
      if (src && src.startsWith("http")) {
        mainImage = src.split("._")[0] + ".jpg";
        break;
      }
    }
  }

  // Fallback to data-old-hires attribute which has high-res images
  if (!mainImage) {
    const hiresImg = document.querySelector("[data-old-hires]");
    if (hiresImg) {
      mainImage = hiresImg.dataset.oldHires;
    }
  }

  metadata.mainImage = mainImage;

  // Availability
  const availabilityElement = document.querySelector(
    "#availability span, #availability"
  );
  metadata.availability = availabilityElement
    ? availabilityElement.textContent.trim()
    : null;

  // Product details (specifications)
  const productDetails = {};
  const detailRows = document.querySelectorAll(
    "#productDetails_detailBullets_sections1 tr, #detailBullets_feature_div li"
  );
  detailRows.forEach((row) => {
    const label = row.querySelector("th, .a-text-bold");
    const value = row.querySelector("td, .a-list-item");
    if (label && value) {
      const key = label.textContent
        .trim()
        .replace(/\s+/g, "_")
        .replace(/:/g, "");
      productDetails[key] = value.textContent.trim();
    }
  });
  metadata.productDetails = productDetails;

  // Category/Breadcrumbs
  const breadcrumbs = [];
  const breadcrumbElements = document.querySelectorAll(
    "#wayfinding-breadcrumbs_feature_div a"
  );
  breadcrumbElements.forEach((crumb) => {
    breadcrumbs.push(crumb.textContent.trim());
  });
  metadata.breadcrumbs = breadcrumbs;

  // Current URL
  metadata.url = window.location.href;

  // Page type detection
  metadata.isProductPage =
    window.location.pathname.includes("/dp/") ||
    window.location.pathname.includes("/gp/product/");

  return metadata;
}

// Inject the React component
function init() {
  const isProductPage =
    window.location.pathname.includes("/dp/") ||
    window.location.pathname.includes("/gp/product/");

  if (!isProductPage) return;

  // Create container for React app
  const container = document.createElement("div");
  container.id = "byebuy-wishlist-root";
  document.body.appendChild(container);

  // Render React component
  const root = createRoot(container);
  root.render(<AddToWishlistButton />);
}

// Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
