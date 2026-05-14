import { showMessage } from "../../utils/ui.js";
import {
  addItemToWishlist,
  currency,
  getCartItems,
  getWishlistItems,
  moveWishlistItemToCart,
  removeWishlistItem,
} from "../../services/cartStore.js";

const SAMPLE_ITEMS = [
  { id: "veg-supreme", name: "Veg Supreme Pizza", price: 9500, qty: 1 },
  { id: "pepperoni-classic", name: "Pepperoni Classic", price: 11200, qty: 1 },
  { id: "bbq-chicken", name: "BBQ Chicken Pizza", price: 12500, qty: 1 },
];

const itemsContainer = document.getElementById("wishlistItems");
const totalEl = document.getElementById("wishlistTotal");
const seedBtn = document.getElementById("seedWishlistBtn");

const sumAmount = (items) =>
  items.reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.qty || 1),
    0,
  );

const getCheckoutButton = () =>
  document.querySelector('a[href="../../pages/view/checkout.html"]');

const refreshCheckoutButtonState = () => {
  const checkoutButton = getCheckoutButton();

  if (!checkoutButton) {
    return;
  }

  const cartCount = getCartItems().length;
  checkoutButton.textContent =
    cartCount > 0
      ? `Proceed to Checkout (${cartCount})`
      : "Proceed to Checkout";
};

const renderWishlist = () => {
  const items = getWishlistItems();
  itemsContainer.innerHTML = "";

  if (items.length === 0) {
    itemsContainer.innerHTML =
      "<p>Your wishlist is empty. Add sample items or continue shopping to save favorites.</p>";
    totalEl.textContent = currency(0);
    refreshCheckoutButtonState();
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "wishlist-item";
    row.innerHTML = `
      <div>
        <h3>${item.name}</h3>
        <p>Quantity preference: ${Number(item.qty || 1)}</p>
      </div>
      <p class="price">${currency(item.price)}</p>
      <div class="action-row">
        <button class="mini-btn primary" data-action="cart" data-id="${item.id}" type="button">Add to Cart</button>
        <button class="mini-btn ghost" data-action="remove" data-id="${item.id}" type="button">Remove</button>
      </div>
    `;
    itemsContainer.appendChild(row);
  });

  totalEl.textContent = currency(sumAmount(items));
  refreshCheckoutButtonState();
};

itemsContainer?.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const id = target.dataset.id;
  const action = target.dataset.action;

  if (!id || !action) {
    return;
  }

  if (action === "cart") {
    const result = moveWishlistItemToCart(id);

    if (result.moved) {
      showMessage("Item moved to cart.", "success");
      renderWishlist();
    }

    return;
  }

  if (action === "remove") {
    removeWishlistItem(id);
    showMessage("Item removed from wishlist.", "success");
    renderWishlist();
  }
});

seedBtn?.addEventListener("click", () => {
  SAMPLE_ITEMS.forEach((item) => addItemToWishlist(item));
  showMessage("Sample wishlist items added.", "success");
  renderWishlist();
});

renderWishlist();
