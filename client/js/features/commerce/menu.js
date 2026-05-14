const readList = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeList = (key, items) => {
  localStorage.setItem(key, JSON.stringify(items));

  if (key === "cart_items") {
    window.dispatchEvent(new Event("cart:updated"));
  }

  if (key === "wishlist_items") {
    window.dispatchEvent(new Event("wishlist:updated"));
  }
};

const parsePrice = (text) => {
  const numeric = String(text || "").replace(/[^\d.]/g, "");
  return Number(numeric || 0);
};

const slugify = (value) =>
  String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const initMenuCards = () => {
  const cards = Array.from(document.querySelectorAll(".menu-card"));

  cards.forEach((card, index) => {
    const title =
      card.querySelector(".card-title")?.textContent?.trim() || "Menu Item";
    const priceText =
      card.querySelector(".card-price")?.textContent?.trim() || "$0";
    const image = card.querySelector("img")?.getAttribute("src") || "";
    const id = `${slugify(title)}-${index + 1}`;
    const item = {
      id,
      name: title,
      price: parsePrice(priceText),
      qty: 1,
      image,
    };

    const addCartBtn = card.querySelector(".add-cart-btn");
    const favoriteBtn = card.querySelector(".favorite-btn");
    const icon = favoriteBtn?.querySelector("i");

    const isInWishlist = () =>
      readList("wishlist_items").some((entry) => entry.id === id);

    const syncFavoriteIcon = () => {
      if (!icon) {
        return;
      }

      const active = isInWishlist();
      icon.classList.toggle("fas", active);
      icon.classList.toggle("far", !active);
    };

    addCartBtn?.addEventListener("click", (event) => {
      event.preventDefault();

      const cart = readList("cart_items");
      const existing = cart.find((entry) => entry.id === id);

      if (existing) {
        existing.qty = Number(existing.qty || 1) + 1;
      } else {
        cart.push(item);
      }

      writeList("cart_items", cart);

      const originalText = addCartBtn.textContent;
      addCartBtn.textContent = "Added! ✓";
      addCartBtn.style.background = "var(--accent-dark)";

      setTimeout(() => {
        addCartBtn.textContent = originalText;
        addCartBtn.style.background = "";
      }, 1200);
    });

    favoriteBtn?.addEventListener("click", (event) => {
      event.preventDefault();

      const wishlist = readList("wishlist_items");
      const exists = wishlist.some((entry) => entry.id === id);

      const next = exists
        ? wishlist.filter((entry) => entry.id !== id)
        : [...wishlist, item];

      writeList("wishlist_items", next);
      syncFavoriteIcon();
    });

    syncFavoriteIcon();
  });
};
