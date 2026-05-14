import {
  getProducts,
  addProduct,
  setProducts,
  removeProduct,
  updateProduct,
} from "../../services/productStore.js";
import { showMessage } from "../../utils/ui.js";

const form = document.getElementById("productForm");
const productsEl = document.getElementById("products");
const clearBtn = document.getElementById("clearBtn");
const imageFileEl = document.getElementById("imageFile");
const imagePreview = document.getElementById("imagePreview");
const imageUrlInput = document.getElementById("imageUrlInput");

let currentImageData = null;
let editingId = null;

const render = () => {
  const list = getProducts();
  productsEl.innerHTML = "";
  list.forEach((p) => {
    const row = document.createElement("div");
    row.className = "product-row";
    row.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${p.image || "../../assets/images/placeholder.png"}" style="width:56px;height:44px;object-fit:cover;border-radius:8px" />
        <div><strong>${p.name}</strong> <div style="color:var(--muted);font-size:12px">${p.sku || ""} • ${p.category || ""}</div></div>
      </div>
      <div>
        <button data-id="${p.id}" class="btn btn-secondary btn-edit">Edit</button>
        <button data-id="${p.id}" class="btn btn-secondary btn-remove">Remove</button>
      </div>
    `;
    productsEl.appendChild(row);
  });
};

imageFileEl?.addEventListener("change", (e) => {
  const f = imageFileEl.files && imageFileEl.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentImageData = reader.result;
    if (imagePreview) {
      imagePreview.src = currentImageData;
      imagePreview.style.display = "block";
    }
    if (imageUrlInput) imageUrlInput.value = currentImageData;
  };
  reader.readAsDataURL(f);
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const product = {
    name: String(fd.get("name") || "").trim(),
    price: Number(fd.get("price") || 0),
    image: currentImageData || String(fd.get("image") || "").trim(),
    category: String(fd.get("category") || "").trim(),
    sku: String(fd.get("sku") || "").trim(),
  };
  if (!product.name || !product.price) {
    showMessage("Name and price required", "error");
    return;
  }

  if (editingId) {
    updateProduct(editingId, product);
    showMessage("Product updated", "success");
    editingId = null;
  } else {
    addProduct(product);
    showMessage("Product added", "success");
  }

  form.reset();
  currentImageData = null;
  if (imagePreview) {
    imagePreview.src = "";
    imagePreview.style.display = "none";
  }
  render();
});

productsEl?.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const id = t.dataset.id;
  if (!id) return;

  if (t.classList.contains("btn-remove")) {
    removeProduct(id);
    showMessage("Product removed", "success");
    render();
    return;
  }

  if (t.classList.contains("btn-edit")) {
    const product = getProducts().find((p) => p.id === id);
    if (!product) return;
    // populate form for editing
    form.name.value = product.name || "";
    form.price.value = product.price || 0;
    form.category.value = product.category || "";
    form.sku.value = product.sku || "";
    imageUrlInput.value = product.image || "";
    if (product.image) {
      currentImageData = product.image;
      imagePreview.src = product.image;
      imagePreview.style.display = "block";
    }
    editingId = id;
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
});

clearBtn?.addEventListener("click", () => {
  if (!confirm("Clear all products? This will remove them from localStorage."))
    return;
  setProducts([]);
  render();
});

render();
