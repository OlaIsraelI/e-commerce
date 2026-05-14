import { getOrders, clearOrders } from "../../services/cartStore.js";

const container = document.getElementById("orders");

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  })
    .format(Number(v || 0))
    .replace("NGN", "N");

const render = () => {
  const orders = getOrders();
  container.innerHTML = "";
  if (!orders.length) {
    container.innerHTML = '<p class="empty">No orders yet.</p>';
    return;
  }

  orders.forEach((o) => {
    const card = document.createElement("div");
    card.className = "order-card";
    const created = new Date(o.createdAt).toLocaleString();
    const items = (o.items || [])
      .map((it) => `${it.name} x ${it.qty}`)
      .join(", ");
    card.innerHTML = `
      <div>
        <div style="font-weight:600">${o.fullName} <span style="color:var(--muted);font-weight:400">${o.phone}</span></div>
        <div class="order-meta">${created} • ${o.orderId || ""}</div>
        <div style="margin-top:8px">${items}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:var(--accent)">${formatCurrency(o.total)}</div>
        <div style="margin-top:8px"><button class="btn btn-secondary btn-view" data-id="${o.orderId}">View</button></div>
      </div>
    `;
    container.appendChild(card);
  });
};

container?.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.classList.contains("btn-view")) {
    const id = t.dataset.id;
    const orders = getOrders();
    const order = orders.find((o) => o.orderId === id);
    if (!order) return alert("Order not found");
    const win = window.open("", "_blank", "width=600,height=800");
    win.document.write("<pre>" + JSON.stringify(order, null, 2) + "</pre>");
  }
});

render();
