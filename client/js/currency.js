// js/currency.js
const CURRENCY = {
  symbol: "₦",
  code: "NGN",
  name: "Naira",
};

function formatCurrency(amount, showSymbol = true) {
  const formatted = amount.toFixed(2);
  if (showSymbol) {
    return `${CURRENCY.symbol}${formatted}`;
  }
  return formatted;
}

function parseCurrency(currencyString) {
  // Remove ₦ symbol and commas, convert to number
  const numeric = currencyString.replace(/[₦,]/g, "");
  return parseFloat(numeric);
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CURRENCY, formatCurrency, parseCurrency };
}
