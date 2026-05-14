import { showMessage } from "../../utils/ui.js";
import {
  clearCart,
  currency,
  getCartItems,
  saveLastOrder,
} from "../../services/cartStore.js";

const DELIVERY_FEE = 1500;

const form = document.getElementById("checkoutForm");
const submitBtn = document.getElementById("placeOrderBtn");
const itemsContainer = document.getElementById("checkoutItems");
const subtotalEl = document.getElementById("subtotal");
const deliveryFeeEl = document.getElementById("deliveryFee");
const grandTotalEl = document.getElementById("grandTotal");

const sumAmount = (items) =>
  items.reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.qty || 1),
    0,
  );

const renderSummary = () => {
  const cartItems = getCartItems();
  itemsContainer.innerHTML = "";

  if (!cartItems.length) {
    itemsContainer.innerHTML =
      "<p>Your cart is empty. Add items from wishlist before payment.</p>";
    subtotalEl.textContent = currency(0);
    // still display configured delivery fee, but total is zero
    if (deliveryFeeEl) deliveryFeeEl.textContent = currency(DELIVERY_FEE);
    grandTotalEl.textContent = currency(0);
    if (submitBtn) {
      submitBtn.disabled = true;
    }
    return;
  }

  cartItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "summary-item";
    row.innerHTML = `
      <span>${item.name} x ${Number(item.qty || 1)}</span>
      <strong>${currency(Number(item.price || 0) * Number(item.qty || 1))}</strong>
    `;
    itemsContainer.appendChild(row);
  });

  const subtotal = sumAmount(cartItems);
  const total = subtotal + DELIVERY_FEE;

  subtotalEl.textContent = currency(subtotal);
  if (deliveryFeeEl) deliveryFeeEl.textContent = currency(DELIVERY_FEE);
  grandTotalEl.textContent = currency(total);

  if (submitBtn) {
    submitBtn.disabled = false;
  }
};

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const cartItems = getCartItems();

  if (!cartItems.length) {
    showMessage("Your cart is empty.", "error");
    return;
  }

  const formData = new FormData(form);
  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const paymentMethod = String(formData.get("paymentMethod") || "").trim();

  if (!fullName || !phone || !address || !paymentMethod) {
    showMessage("Please fill in all payment and delivery fields.", "error");
    return;
  }

  const subtotal = sumAmount(cartItems);
  const total = subtotal + DELIVERY_FEE;

  const orderId = `ORD-${Date.now().toString(36)}`;

  saveLastOrder({
    createdAt: new Date().toISOString(),
    orderId,
    fullName,
    phone,
    address,
    paymentMethod,
    items: cartItems,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    total,
  });

  clearCart();
  showMessage(
    "Payment option selected and order placed successfully!",
    "success",
    4000,
  );

  setTimeout(() => {
    window.location.href = "../../pages/view/confirmation.html";
  }, 800);
});

renderSummary();
