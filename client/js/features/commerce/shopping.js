import { showMessage } from "../../utils/ui.js";
import {
  currency,
  getCartItems,
  removeCartItem,
  updateCartItemQty,
} from "../../services/cartStore.js";

const itemsContainer = document.getElementById("shoppingItems");
const itemCountEl = document.getElementById("itemCount");
const subtotalEl = document.getElementById("shoppingSubtotal");

const sumAmount = (items) =>
  items.reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.qty || 1),
    0,
  );

const totalQty = (items) =>
  items.reduce((acc, item) => acc + Number(item.qty || 1), 0);

const renderShoppingList = () => {
  const cartItems = getCartItems();
  itemsContainer.innerHTML = "";

  if (!cartItems.length) {
    itemsContainer.innerHTML = `
      <tr class="shopping-row shopping-row-empty">
        <td colspan="5">Your shopping list is empty. Add items from the menu or wishlist.</td>
      </tr>
    `;
    itemCountEl.textContent = "0";
    subtotalEl.textContent = currency(0);
    return;
  }

  cartItems.forEach((item) => {
    const row = document.createElement("tr");
    row.className = "shopping-row";
    row.innerHTML = `
      <td>
        <div class="cart-product">
          <img src="${item.image || "../../assets/images/close-up-delicious-pizza.jpg"}" alt="${item.name}">
          <div>
            <h3>${item.name}</h3>
            <p>${currency(item.price)} each</p>
          </div>
        </div>
      </td>
      <td>${currency(item.price)}</td>
      <td>
        <input class="qty-input" data-action="qty" data-id="${item.id}" type="number" min="1" value="${Number(item.qty || 1)}" aria-label="Quantity for ${item.name}">
      </td>
      <td><strong>${currency(Number(item.price || 0) * Number(item.qty || 1))}</strong></td>
      <td>
        <button class="remove-btn" data-action="remove" data-id="${item.id}" type="button">Remove</button>
      </td>
    `;
    itemsContainer.appendChild(row);
  });

  itemCountEl.textContent = String(totalQty(cartItems));
  subtotalEl.textContent = currency(sumAmount(cartItems));
};

itemsContainer?.addEventListener("change", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.dataset.action !== "qty") {
    return;
  }

  const id = target.dataset.id;

  if (!id) {
    return;
  }

  updateCartItemQty(id, Number(target.value || 1));
  showMessage("Cart quantity updated.", "success");
  renderShoppingList();
});

itemsContainer?.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.dataset.action !== "remove") {
    return;
  }

  const id = target.dataset.id;

  if (!id) {
    return;
  }

  removeCartItem(id);
  showMessage("Item removed from shopping list.", "success");
  renderShoppingList();
});

renderShoppingList();
