/**
 * PDF Receipt Generator for Orders
 * Uses jsPDF to generate professional order receipts as PDFs
 */

export const generateReceiptPDF = (order) => {
  // Check if jsPDF is available
  if (typeof window.jspdf === "undefined") {
    console.error("jsPDF library not loaded. Please include it in your HTML.");
    return null;
  }

  const { jsPDF } = window.jspdf;

  // Create PDF document
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Helper function for lines
  const drawLine = (y) => {
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const drawSection = (title, items) => {
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(title, margin, yPosition);
    yPosition += 6;

    doc.setFont(undefined, "normal");
    doc.setFontSize(9);

    items.forEach((item) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }

      if (item.label && item.value) {
        doc.setFont(undefined, item.bold ? "bold" : "normal");
        doc.text(item.label, margin, yPosition);

        const valueWidth = doc.getTextWidth(item.value);
        doc.text(item.value, pageWidth - margin - valueWidth, yPosition);

        yPosition += 5;
      }
    });

    yPosition += 3;
  };

  // Header - Restaurant Name
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("ULTRAVEG PIZZA", margin, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text("Order Confirmation & Receipt", margin, yPosition);
  yPosition += 8;

  drawLine(yPosition);
  yPosition += 5;

  // Order Number and Date
  drawSection("Order Information", [
    { label: "Order ID:", value: order.orderId || "N/A", bold: true },
    { label: "Date:", value: new Date(order.date).toLocaleDateString() },
    { label: "Time:", value: new Date(order.date).toLocaleTimeString() },
    { label: "Status:", value: (order.status || "pending").toUpperCase() },
  ]);

  drawLine(yPosition);
  yPosition += 5;

  // Customer Information
  const customerInfo = [
    {
      label: "Name:",
      value: `${order.customer.firstName} ${order.customer.lastName}`,
    },
    { label: "Phone:", value: order.customer.phone },
    { label: "Address:", value: order.customer.address },
  ];

  if (order.customer.city) {
    customerInfo.push({ label: "City:", value: order.customer.city });
  }

  drawSection("Delivery Address", customerInfo);

  drawLine(yPosition);
  yPosition += 5;

  // Order Items
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Items Ordered", margin, yPosition);
  yPosition += 6;

  // Column headers
  doc.setFontSize(8);
  doc.setFont(undefined, "bold");
  doc.text("Item", margin, yPosition);
  doc.text("Qty", pageWidth - margin - 40, yPosition);
  doc.text("Price", pageWidth - margin - 25, yPosition);

  yPosition += 4;
  drawLine(yPosition);
  yPosition += 4;

  // Items
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);

  order.items.forEach((item) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    const itemName = item.name.substring(0, 30);
    doc.text(itemName, margin, yPosition);

    const quantity = `${item.quantity}`;
    doc.text(quantity, pageWidth - margin - 40, yPosition);

    const price = `₦${(item.price * item.quantity).toFixed(2)}`;
    doc.text(price, pageWidth - margin - 25, yPosition);

    yPosition += 5;
  });

  yPosition += 2;
  drawLine(yPosition);
  yPosition += 5;

  // Summary
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);

  // Subtotal
  const subtotalValue = `₦${(order.subtotal || 0).toFixed(2)}`;
  doc.text("Subtotal:", margin, yPosition);
  doc.text(
    subtotalValue,
    pageWidth - margin - doc.getTextWidth(subtotalValue),
    yPosition,
  );
  yPosition += 5;

  // Delivery Fee
  const deliveryFee = order.deliveryFee || 0;
  const deliveryValue = `₦${deliveryFee.toFixed(2)}`;
  doc.text("Delivery Fee:", margin, yPosition);
  doc.text(
    deliveryValue,
    pageWidth - margin - doc.getTextWidth(deliveryValue),
    yPosition,
  );
  yPosition += 5;

  // Discount (if any)
  if (order.discount > 0) {
    const discountValue = `-₦${(order.discount || 0).toFixed(2)}`;
    doc.text("Discount:", margin, yPosition);
    doc.text(
      discountValue,
      pageWidth - margin - doc.getTextWidth(discountValue),
      yPosition,
    );
    yPosition += 5;
  }

  drawLine(yPosition);
  yPosition += 4;

  // Total
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  const total =
    order.total || order.subtotal - (order.discount || 0) + deliveryFee;
  const totalValue = `₦${total.toFixed(2)}`;
  doc.text("TOTAL AMOUNT:", margin, yPosition);
  doc.text(
    totalValue,
    pageWidth - margin - doc.getTextWidth(totalValue),
    yPosition,
  );
  yPosition += 8;

  // Additional Information
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);

  const sections = [];

  if (order.paymentMethod) {
    sections.push(
      `Payment Method: ${order.paymentMethod.replace("-", " ").toUpperCase()}`,
    );
  }

  if (order.deliveryMethod) {
    sections.push(
      `Delivery: ${order.deliveryMethod.replace("-", " ").toUpperCase()}`,
    );
  }

  if (order.customer.notes) {
    sections.push(`Special Requests: ${order.customer.notes}`);
  }

  sections.forEach((section, index) => {
    if (yPosition > pageHeight - 15) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(section, margin, yPosition);
    yPosition += 5;
  });

  yPosition += 5;

  // Footer
  drawLine(yPosition);
  yPosition += 4;

  doc.setFont(undefined, "italic");
  doc.setFontSize(8);
  doc.setTextColor(100);

  const footerText =
    "Thank you for your order! Please keep this receipt for your records.";
  const textWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - textWidth) / 2, yPosition);

  yPosition += 5;

  const contactText = "Questions? Contact us at support@ultravegpizza.com";
  const contactWidth = doc.getTextWidth(contactText);
  doc.text(contactText, (pageWidth - contactWidth) / 2, yPosition);

  // Reset color
  doc.setTextColor(0);

  return doc;
};

export const downloadReceiptPDF = (order) => {
  const doc = generateReceiptPDF(order);

  if (!doc) {
    alert("Unable to generate PDF. jsPDF library may not be loaded.");
    return false;
  }

  const fileName = `Receipt-${order.orderId || "Order"}-${new Date().getTime()}.pdf`;
  doc.save(fileName);
  return true;
};

export const openReceiptPDF = (order) => {
  const doc = generateReceiptPDF(order);

  if (!doc) {
    alert("Unable to generate PDF. jsPDF library may not be loaded.");
    return false;
  }

  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
  return true;
};
