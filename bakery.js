"use strict";

// Product details and favorite IDs are separate arrays so saved data stays small.
const products = [
  { id: "signature-loaf", name: "Signature Loaf", description: "Slow-risen bread for the family table.", price: "$5–$12 per loaf" },
  { id: "morning-pastries", name: "Morning Pastries", description: "Flaky treats for breakfast or your commute.", price: "$3–$7 each" },
  { id: "celebration-cake", name: "Celebration Cake", description: "A made-by-request cake for your next gathering.", price: "$28–$75 per cake" }
];
const storageKey = "north-star-bakery-favorites";
let storageAvailable = true;
let favoriteIds = loadFavorites();

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(saved)) return [];
    return [...new Set(saved.filter(id => products.some(product => product.id === id)))];
  } catch (error) {
    storageAvailable = false;
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(favoriteIds));
    storageAvailable = true;
  } catch (error) {
    storageAvailable = false;
  }
}

function getFavoriteProducts() {
  return products.filter(product => favoriteIds.includes(product.id));
}

function toggleFavorite(id) {
  favoriteIds = favoriteIds.includes(id)
    ? favoriteIds.filter(favoriteId => favoriteId !== id)
    : [...favoriteIds, id];
  saveFavorites();
  renderFavorites("Your favorites have been updated.");
}

function renderFavorites(message) {
  document.querySelectorAll("[data-favorite-id]").forEach(button => {
    const saved = favoriteIds.includes(button.dataset.favoriteId);
    const product = products.find(item => item.id === button.dataset.favoriteId);
    button.setAttribute("aria-pressed", String(saved));
    button.textContent = saved ? "Remove favorite" : "Save favorite";
    button.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${product.name} ${saved ? "from" : "to"} favorites`);
  });
  const list = document.getElementById("favorites-list");
  list.replaceChildren();
  getFavoriteProducts().forEach(product => {
    const item = document.createElement("li");
    item.textContent = product.name;
    list.append(item);
  });
  document.getElementById("favorites-count").textContent = `(${favoriteIds.length})`;
  document.getElementById("favorites-status").textContent = favoriteIds.length
    ? message : "No favorites yet. Save an item above to start your list.";
  document.getElementById("storage-notice").textContent = storageAvailable
    ? "" : "Browser storage is unavailable. You can use this list now, but it may not be remembered when you leave.";
}

function setupFavorites() {
  const feature = document.getElementById("favorites-feature");
  if (!feature) return;
  const options = document.getElementById("favorite-options");
  products.forEach(product => {
    const item = document.createElement("li");
    const heading = document.createElement("h3");
    heading.textContent = product.name;
    const description = document.createElement("p");
    description.textContent = product.description;
    const price = document.createElement("p");
    price.textContent = product.price;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.favoriteId = product.id;
    button.addEventListener("click", () => toggleFavorite(product.id));
    item.append(heading, description, price, button);
    options.append(item);
  });
  feature.hidden = false;
  renderFavorites("Your saved favorites were loaded from this browser.");
}

function setupContactFavorites() {
  const panel = document.getElementById("contact-favorites");
  if (!panel || !favoriteIds.length) return;
  const names = getFavoriteProducts().map(product => product.name);
  document.getElementById("contact-favorites-list").textContent = names.join(", ");
  panel.hidden = false;
  document.getElementById("use-favorites").addEventListener("click", () => {
    const details = document.getElementById("item-details");
    const line = "I am interested in: " + names.join(", ") + ".";
    if (!details.value.includes(line)) {
      details.value = details.value.trim() ? details.value.trim() + "\n" + line : line;
    }
    document.getElementById("contact-favorites-status").textContent = "Your favorites are in Item details below. Add quantities and any special requests.";
    details.dispatchEvent(new Event("input", { bubbles: true }));
    details.focus();
  });
}

function localDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Each rule object describes one form field; personal form entries are not stored.
const validationRules = [
  { id: "customer-name", label: "your name", required: true, min: 2, max: 80 },
  { id: "customer-email", label: "your email address", required: true, email: true, max: 254 },
  { id: "request-type", label: "a request type", required: true },
  { id: "pickup-date", label: "a pickup date", pickup: true },
  { id: "item-details", label: "item details", required: true, min: 10, max: 1000 },
  { id: "allergy-notes", label: "allergy notes", max: 500 }
];

function getFieldError(rule) {
  const field = document.getElementById(rule.id);
  const value = field.value.trim();
  if (rule.required && !value) return `Please enter ${rule.label}.`;
  if (rule.min && value.length < rule.min) return `Please use at least ${rule.min} characters for ${rule.label}.`;
  if (rule.max && value.length > rule.max) return `Please keep ${rule.label} to ${rule.max} characters or fewer.`;
  if (rule.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || field.validity.typeMismatch)) {
    return "Enter a valid email address, such as name@example.com.";
  }
  if (rule.pickup) {
    if (!value && document.getElementById("request-type").value === "pre-order") return "Choose a pickup date for your pre-order.";
    if (value && value < localDateString()) return "Choose today or a future pickup date.";
    if (value && new Date(value + "T12:00:00").getDay() === 1) return "The bakery is closed on Mondays. Choose another pickup day.";
  }
  return "";
}

function validateField(rule) {
  const message = getFieldError(rule);
  const field = document.getElementById(rule.id);
  document.getElementById(rule.id + "-error").textContent = message;
  field.setAttribute("aria-invalid", String(Boolean(message)));
  return !message;
}

function setupFormValidation() {
  const form = document.getElementById("request-form");
  if (!form) return;
  // Enable custom inline feedback only once JavaScript is running.
  form.noValidate = true;
  document.getElementById("submit-request").disabled = false;
  document.getElementById("pickup-date").min = localDateString();
  const status = document.getElementById("form-status");
  let attempted = false;
  validationRules.forEach(rule => {
    const field = document.getElementById(rule.id);
    field.addEventListener("blur", () => {
      if (field.value || attempted) validateField(rule);
    });
    field.addEventListener("input", () => {
      status.textContent = "";
      if (attempted || field.hasAttribute("aria-invalid")) validateField(rule);
    });
  });
  document.getElementById("request-type").addEventListener("change", () => {
    document.getElementById("pickup-date").required = document.getElementById("request-type").value === "pre-order";
    if (attempted) validateField(validationRules.find(rule => rule.pickup));
  });
  form.addEventListener("submit", event => {
    // This classroom site has no order service; never imply that an order was sent.
    event.preventDefault();
    attempted = true;
    const invalid = validationRules.filter(rule => !validateField(rule));
    if (invalid.length) {
      status.textContent = `Please fix ${invalid.length} ${invalid.length === 1 ? "field" : "fields"} below. Your entries are still here.`;
      document.getElementById(invalid[0].id).focus();
    } else {
      status.textContent = "Your request details passed all checks. This classroom demo has not sent a request or placed an order.";
      status.focus();
    }
  });
}

setupFavorites();
setupContactFavorites();
setupFormValidation();
