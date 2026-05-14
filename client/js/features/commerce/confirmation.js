const LAST_ORDER_KEY = "last_order";

const el = (id) => document.getElementById(id);

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  })
    .format(Number(v || 0))
    .replace("NGN", "N");

const render = () => {
  const raw = localStorage.getItem(LAST_ORDER_KEY);
  const container = el("orderDetails");

  if (!raw) {
    container.innerHTML = '<p class="empty">No recent order found.</p>';
    return;
  }

  let order;
  try {
    order = JSON.parse(raw);
  } catch (e) {
    container.innerHTML = '<p class="empty">Invalid order data.</p>';
    return;
  }

  const created = new Date(order.createdAt).toLocaleString();

  const meta = document.createElement("div");
  meta.className = "order-meta";
  meta.innerHTML = `
    <div><strong>Order date</strong><div>${created}</div></div>
    <div><strong>Order ID</strong><div>${order.orderId || ""}</div></div>
    <div><strong>Name</strong><div>${order.fullName}</div></div>
    <div><strong>Phone</strong><div>${order.phone}</div></div>
    <div><strong>Payment</strong><div>${order.paymentMethod}</div></div>
  `;

  const itemsWrap = document.createElement("div");
  itemsWrap.className = "order-items";
  itemsWrap.innerHTML = "<strong>Items</strong>";

  (order.items || []).forEach((it) => {
    const row = document.createElement("div");
    row.className = "order-item";
    row.innerHTML = `<div>${it.name} x ${it.qty}</div><div>${formatCurrency(it.price * it.qty)}</div>`;
    itemsWrap.appendChild(row);
  });

  const totals = document.createElement("div");
  totals.style.marginTop = "12px";
  totals.innerHTML = `
    <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
    <p><strong>Delivery:</strong> ${formatCurrency(order.deliveryFee)}</p>
    <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
  `;

  container.innerHTML = "";
  container.appendChild(meta);
  container.appendChild(itemsWrap);
  container.appendChild(totals);

  const downloadBtn = document.createElement("button");
  downloadBtn.className = "btn btn-primary";
  downloadBtn.textContent = "Download Receipt";
  // create printable receipt and open print dialog for PDF saving
  downloadBtn.addEventListener("click", () => {
    const lines = (order.items || []).map(
      (it) =>
        `<tr><td>${it.name}</td><td>${it.qty}</td><td style="text-align:right">${formatCurrency(
          it.price * it.qty,
        )}</td></tr>`,
    );

    const logo =
      (order.items && order.items[0] && order.items[0].image) ||
      "../../assets/images/herosection.png";
    const html = `
      <html>
        <head>
          <title>Receipt ${order.orderId || ""}</title>
          <style>
            :root{ --bg: #fff; --muted:#666; --accent:var(--accent)}
            body{font-family: Inter, system-ui, Arial, sans-serif; padding:20px; color:#111}
            .header{display:flex;align-items:center;gap:12px}
            .logo{width:90px;height:60px;object-fit:cover;border-radius:8px}
            table{width:100%;border-collapse:collapse;margin-top:12px}
            td,th{padding:8px;border-bottom:1px solid #eee}
            .totals{margin-top:12px;text-align:right;font-weight:700}
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo" src="${logo}" />
            <div>
              <div style="font-weight:700">UltraVeg Pizza</div>
              <div style="color:var(--muted)">Receipt • ${order.orderId || ""}</div>
            </div>
          </div>
          <div style="margin-top:12px">
            <div><strong>Name:</strong> ${order.fullName}</div>
            <div><strong>Phone:</strong> ${order.phone}</div>
            <div><strong>Payment:</strong> ${order.paymentMethod}</div>
            <div><strong>Date:</strong> ${created}</div>
          </div>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${lines.join("")}</tbody>
          </table>
          <div class="totals">
            <div>Subtotal: ${formatCurrency(order.subtotal)}</div>
            <div>Delivery: ${formatCurrency(order.deliveryFee)}</div>
            <div>Total: ${formatCurrency(order.total)}</div>
          </div>
          <script>window.onload = function(){ setTimeout(()=>{ window.print(); },150); }</script>
        </body>
      </html>
    `;

    const w = window.open("", "_blank", "width=700,height=800");
    if (!w) return alert("Popup blocked. Allow popups to print receipts.");
    w.document.write(html);
    w.document.close();
  });

  container.appendChild(downloadBtn);
};

render();
