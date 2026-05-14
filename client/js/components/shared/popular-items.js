/**
 * Popular Items Renderer
 * Renders the "You May Also Like" section dynamically
 */

import { popularItemsManager } from "../popular-items.js";

class PopularItemsRenderer {
  constructor(productsList) {
    this.products = productsList;
  }

  /**
   * Format currency in Naira
   * @param {number} amount
   * @returns {string}
   */
  formatCurrency(amount) {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  /**
   * Render popular items into a container
   * @param {string} containerId - ID of the container element
   * @param {number} limit - Number of items to show
   * @param {string} targetPage - Where the links should point ('menu' or 'categories')
   */
  render(containerId, limit = 4, targetPage = "menu") {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container with id "${containerId}" not found`);
      return;
    }

    const popularItems = popularItemsManager.getPopularItems(
      this.products,
      limit,
    );

    if (popularItems.length === 0) {
      container.innerHTML =
        '<p style="text-align:center; color:#888;">No recommendations available</p>';
      return;
    }

    // Determine link path based on target page
    const linkPath =
      targetPage === "menu" ? "../menu/menu.html" : "./menu.html";

    container.innerHTML = popularItems
      .map((item) => {
        // Calculate discount percentage if applicable
        const hasDiscount = item.oldPrice && item.oldPrice > item.price;
        const discountPercent = hasDiscount
          ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
          : 0;

        return `
                <a href="${linkPath}?product=${item.id}" class="popular-card">
                    <img src="${item.image || "../../assets/images/pizza-placeholder.jpg"}" alt="${item.name}">
                    <div class="popular-card-content">
                        <h4>${item.name}</h4>
                        ${hasDiscount ? `<span class="old-price">${this.formatCurrency(item.oldPrice)}</span>` : ""}
                        <span class="new-price">${this.formatCurrency(item.price)}</span>
                        ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ""}
                    </div>
                </a>
            `;
      })
      .join("");
  }

  /**
   * Update tracking when user interacts with products
   */
  setupTracking() {
    // Track product views when products are clicked
    document.addEventListener("click", (e) => {
      const productCard = e.target.closest(
        ".product-card, .popular-card, .menu-card",
      );
      if (productCard && productCard.dataset.id) {
        popularItemsManager.trackView(parseInt(productCard.dataset.id));
      }
    });
  }
}

export { PopularItemsRenderer, popularItemsManager };
