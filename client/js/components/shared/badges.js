const parseStoredList = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const updateNavCount = (selector, storageKey) => {
  const count = parseStoredList(storageKey).reduce(
    (acc, item) => acc + Number(item?.qty || 1),
    0,
  );

  const links = document.querySelectorAll(selector);

  links.forEach((link) => {
    const label = link.querySelector("span");

    if (!label) {
      return;
    }

    if (!label.dataset.baseLabel) {
      label.dataset.baseLabel = label.textContent
        .trim()
        .replace(/\s*\(\d+\)$/, "");
    }

    label.textContent =
      count > 0
        ? `${label.dataset.baseLabel} (${count})`
        : label.dataset.baseLabel;
  });
};

export const refreshCommerceBadges = () => {
  updateNavCount(".cart-link", "cart_items");
  updateNavCount(".wishlist-link", "wishlist_items");
};

export const initCommerceBadges = () => {
  refreshCommerceBadges();
  window.addEventListener("storage", refreshCommerceBadges);
  window.addEventListener("cart:updated", refreshCommerceBadges);
  window.addEventListener("wishlist:updated", refreshCommerceBadges);
};
