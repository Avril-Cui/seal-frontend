import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function AddToWishlistButton() {
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const handleClick = () => {
    const productData = fetchAmazonProduct();
    console.log("=== AMAZON PRODUCT METADATA ===\n", productData);

    setIsDisabled(true);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsDisabled(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => !isDisabled && setIsHovered(false)}
      className={`
        fixed bottom-2 right-2 z-[10000]
        px-5 py-3 rounded-lg
        text-white text-sm
        transition-all duration-300
        disabled:cursor-not-allowed
        ${isAdded ? "bg-green-600" : "bg-orange-600"}
      `}
      style={{ opacity: isHovered || isAdded ? 1 : 0.5 }}
      disabled={isDisabled}
    >
      {isAdded ? "Added!" : "Add to ByeBuy Wishlist"}
    </button>
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

  // Product description
  const descriptionElement = document.querySelector(
    "#feature-bullets, #productDescription"
  );
  metadata.description = descriptionElement
    ? descriptionElement.textContent.trim()
    : null;

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

  // Main image
  const mainImageElement = document.querySelector(
    "#landingImage, #imgBlkFront"
  );
  metadata.mainImage = mainImageElement
    ? mainImageElement.src || mainImageElement.dataset.src
    : null;

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
