import { getProducts } from "../../services/productStore.js";

const container = document.querySelector(".menu-grid");

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  })
    .format(Number(v || 0))
    .replace("NGN", "N");

const render = () => {
  const products = getProducts();
  if (!container) return;
  container.innerHTML = "";
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.dataset.category = p.category || "";
    card.innerHTML = `
      <div class="card-image">
        <img src="${p.image || "../../../assets/images/placeholder.png"}" alt="${p.name}">
        <button class="favorite-btn" aria-label="Add to favorites"><i class="far fa-heart"></i></button>
      </div>
      <div class="card-content">
        <h3 class="card-title">${p.name}</h3>
        <div class="card-footer">
          <span class="card-price">${formatCurrency(p.price)}</span>
          <div class="card-rating"><span class="stars">5.0</span></div>
        </div>
        <button class="add-cart-btn" data-action="add" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}" data-category="${p.category}" data-sku="${p.sku}">Add to cart</button>
      </div>
    `;
    container.appendChild(card);
  });
};

render();

// Re-render when products change in storage (simple approach: listen for storage event)
window.addEventListener("storage", (e) => {
  if (e.key && e.key.startsWith("products")) render();
});
