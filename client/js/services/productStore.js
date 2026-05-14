const PRODUCTS_KEY = "products_v1";

const parse = (v) => {
  try {
    const p = JSON.parse(v || "[]");
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};
const read = () => parse(localStorage.getItem(PRODUCTS_KEY));
const write = (items) =>
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(items));

const defaultProducts = [
  {
    id: "p1",
    name: "Veggie Pizza",
    price: 2200,
    image:
      "../../assets/images/delicious-whole-vegetable-pizza-loaded-with-colorful-toppings-like-broccoli-peppers-olives-sliced-ready-serve-against-black-background_84443-59206.avif",
    category: "pizza",
    sku: "VGP-001",
    qty: 1,
  },
  {
    id: "p2",
    name: "Margherita",
    price: 1800,
    image:
      "../../assets/images/delicious-whole-vegetable-pizza-loaded-with-colorful-toppings-like-broccoli-peppers-olives-sliced-ready-serve-against-black-background_84443-59206.avif",
    category: "pizza",
    sku: "MRG-001",
    qty: 1,
  },
  {
    id: "p3",
    name: "Lemon Pie",
    price: 1200,
    image:
      "../../assets/images/delicious-whole-vegetable-pizza-loaded-with-colorful-toppings-like-broccoli-peppers-olives-sliced-ready-serve-against-black-background_84443-59206.avif",
    category: "dessert",
    sku: "LMP-001",
    qty: 1,
  },
  {
    id: "p4",
    name: "Fresh Juice",
    price: 500,
    image:
      "../../assets/images/delicious-whole-vegetable-pizza-loaded-with-colorful-toppings-like-broccoli-peppers-olives-sliced-ready-serve-against-black-background_84443-59206.avif",
    category: "drinks",
    sku: "FRJ-001",
    qty: 1,
  },
];

export const getProducts = () => {
  const existing = read();
  if (!existing.length) {
    write(defaultProducts);
    return defaultProducts.slice();
  }
  return existing;
};

export const setProducts = (items) => {
  write(items);
  return items;
};

export const addProduct = (product) => {
  const list = getProducts();
  const next = [{ ...product, id: product.id || `p_${Date.now()}` }, ...list];
  write(next);
  return next;
};

export const updateProduct = (id, patch) => {
  const list = getProducts();
  const next = list.map((p) => (p.id === id ? { ...p, ...patch } : p));
  write(next);
  return next;
};

export const removeProduct = (id) => {
  const next = getProducts().filter((p) => p.id !== id);
  write(next);
  return next;
};

export const clearProducts = () => write([]);

export default {
  getProducts,
  setProducts,
  addProduct,
  updateProduct,
  removeProduct,
};
