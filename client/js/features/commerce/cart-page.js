import { addItemToCart } from "../../services/cartStore.js";
import { showMessage } from "../../utils/ui.js";

// Delegate click handler for add-to-cart buttons
document.addEventListener("click", (e) => {
  const target = /** @type {HTMLElement} */ (e.target);
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  if (action !== "add") return;

  const id = target.dataset.id;
  const name = target.dataset.name;
  const price = Number(target.dataset.price || 0);
  const image = target.dataset.image || null;
  const category = target.dataset.category || null;
  const sku = target.dataset.sku || null;

  if (!id || !name) {
    showMessage("Invalid product data.", "error");
    return;
  }

  const item = {
    id,
    name,
    price,
    qty: 1,
    image,
    category,
    sku,
  };

  addItemToCart(item);
  showMessage(`${name} added to cart.`, "success");
});
