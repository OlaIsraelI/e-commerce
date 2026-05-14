const WISHLIST_KEY = "wishlist_items";
const CART_KEY = "cart_items";
const LAST_ORDER_KEY = "last_order";
const ORDERS_KEY = "orders_v1";

const parseList = (value) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readList = (key) => parseList(localStorage.getItem(key));
const writeList = (key, items) => {
  localStorage.setItem(key, JSON.stringify(items));

  if (key === CART_KEY) {
    window.dispatchEvent(new Event("cart:updated"));
  }

  if (key === WISHLIST_KEY) {
    window.dispatchEvent(new Event("wishlist:updated"));
  }
};

export const currency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  })
    .format(Number(amount || 0))
    .replace("NGN", "N");

export const getWishlistItems = () => readList(WISHLIST_KEY);
export const getCartItems = () => readList(CART_KEY);

export const setWishlistItems = (items) => writeList(WISHLIST_KEY, items);
export const setCartItems = (items) => writeList(CART_KEY, items);

export const addItemToWishlist = (item) => {
  const wishlist = getWishlistItems();
  const exists = wishlist.some((entry) => entry.id === item.id);

  if (exists) {
    return wishlist;
  }

  const next = [...wishlist, item];
  setWishlistItems(next);
  return next;
};

export const removeWishlistItem = (id) => {
  const next = getWishlistItems().filter((item) => item.id !== id);
  setWishlistItems(next);
  return next;
};

export const addItemToCart = (item) => {
  const cart = getCartItems();
  const existing = cart.find((entry) => entry.id === item.id);

  if (existing) {
    existing.qty = Number(existing.qty || 1) + Number(item.qty || 1);
  } else {
    cart.push({ ...item, qty: Number(item.qty || 1) });
  }

  setCartItems(cart);
  return cart;
};

export const moveWishlistItemToCart = (id) => {
  const wishlist = getWishlistItems();
  const target = wishlist.find((item) => item.id === id);

  if (!target) {
    return { wishlist, cart: getCartItems(), moved: false };
  }

  const nextWishlist = wishlist.filter((item) => item.id !== id);
  setWishlistItems(nextWishlist);
  const nextCart = addItemToCart(target);

  return { wishlist: nextWishlist, cart: nextCart, moved: true };
};

export const clearCart = () => setCartItems([]);

export const removeCartItem = (id) => {
  const next = getCartItems().filter((item) => item.id !== id);
  setCartItems(next);
  return next;
};

export const updateCartItemQty = (id, qty) => {
  const safeQty = Math.max(1, Number(qty || 1));
  const cart = getCartItems();
  const next = cart.map((item) =>
    item.id === id ? { ...item, qty: safeQty } : item,
  );

  setCartItems(next);
  return next;
};

export const saveLastOrder = (order) => {
  localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  // also append to orders history
  try {
    const raw = localStorage.getItem(ORDERS_KEY) || "[]";
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      list.unshift(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
    } else {
      localStorage.setItem(ORDERS_KEY, JSON.stringify([order]));
    }
  } catch (e) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order]));
  }
};

export const getOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const clearOrders = () => {
  localStorage.removeItem(ORDERS_KEY);
};
