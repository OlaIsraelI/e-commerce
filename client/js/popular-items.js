/**
 * Popular Items Tracker
 * Tracks product popularity based on cart additions, views, and wishlist actions
 * Displays most popular items in "You May Also Like" sections
 */

class PopularItemsManager {
  constructor() {
    this.storageKey = "ultraveg_popular_items";
    this.maxItems = 8; // Store top 8 items
    this.popularityData = this.loadData();
  }

  /**
   * Load popularity data from localStorage
   */
  loadData() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    return {};
  }

  /**
   * Save popularity data to localStorage
   */
  saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.popularityData));
  }

  /**
   * Track a product view
   * @param {number} productId
   */
  trackView(productId) {
    if (!this.popularityData[productId]) {
      this.popularityData[productId] = {
        views: 0,
        cartAdds: 0,
        wishlistAdds: 0,
        lastUpdated: Date.now(),
      };
    }
    this.popularityData[productId].views += 1;
    this.popularityData[productId].lastUpdated = Date.now();
    this.saveData();
  }

  /**
   * Track a cart addition
   * @param {number} productId
   * @param {number} quantity
   */
  trackCartAdd(productId, quantity = 1) {
    if (!this.popularityData[productId]) {
      this.popularityData[productId] = {
        views: 0,
        cartAdds: 0,
        wishlistAdds: 0,
        lastUpdated: Date.now(),
      };
    }
    this.popularityData[productId].cartAdds += quantity;
    this.popularityData[productId].lastUpdated = Date.now();
    this.saveData();
  }

  /**
   * Track wishlist addition
   * @param {number} productId
   */
  trackWishlistAdd(productId) {
    if (!this.popularityData[productId]) {
      this.popularityData[productId] = {
        views: 0,
        cartAdds: 0,
        wishlistAdds: 0,
        lastUpdated: Date.now(),
      };
    }
    this.popularityData[productId].wishlistAdds += 1;
    this.popularityData[productId].lastUpdated = Date.now();
    this.saveData();
  }

  /**
   * Calculate popularity score for a product
   * @param {object} data
   * @returns {number}
   */
  calculateScore(data) {
    // Weight factors: cartAdds are most important, then views, then wishlist
    const cartWeight = 10;
    const viewWeight = 1;
    const wishlistWeight = 5;

    // Time decay: newer interactions are worth more
    const daysSinceUpdate =
      (Date.now() - data.lastUpdated) / (1000 * 60 * 60 * 24);
    const timeDecay = Math.max(0.3, 1 - daysSinceUpdate / 30); // Decay over 30 days

    const score =
      (data.cartAdds * cartWeight +
        data.views * viewWeight +
        data.wishlistAdds * wishlistWeight) *
      timeDecay;

    return score;
  }

  /**
   * Get most popular items sorted by score
   * @param {Array} productsList - Full products array
   * @param {number} limit - Number of items to return
   * @returns {Array}
   */
  getMostPopular(productsList, limit = 4) {
    // Calculate scores for all tracked products
    const scored = Object.keys(this.popularityData)
      .map((id) => {
        const productId = parseInt(id);
        const product = productsList.find((p) => p.id === productId);
        if (!product) return null;

        return {
          ...product,
          popularityScore: this.calculateScore(this.popularityData[productId]),
        };
      })
      .filter((p) => p !== null);

    // Sort by score descending
    scored.sort((a, b) => b.popularityScore - a.popularityScore);

    // Return top N
    return scored.slice(0, limit);
  }

  /**
   * Get fallback recommendations (when not enough data)
   * @param {Array} productsList
   * @param {number} limit
   * @returns {Array}
   */
  getFallbackRecommendations(productsList, limit = 4) {
    // Return products with discounts or highest rated as fallback
    const withDiscount = productsList.filter(
      (p) => p.oldPrice && p.oldPrice > p.price,
    );
    if (withDiscount.length >= limit) {
      return withDiscount.slice(0, limit);
    }

    // Or just return first N products
    return productsList.slice(0, limit);
  }

  /**
   * Get popular items (with fallback)
   * @param {Array} productsList
   * @param {number} limit
   * @returns {Array}
   */
  getPopularItems(productsList, limit = 4) {
    const popular = this.getMostPopular(productsList, limit);

    // If we have enough tracked data, return it
    if (popular.length >= limit) {
      return popular;
    }

    // Otherwise, supplement with fallback recommendations
    const existingIds = new Set(popular.map((p) => p.id));
    const fallback = this.getFallbackRecommendations(
      productsList.filter((p) => !existingIds.has(p.id)),
      limit - popular.length,
    );

    return [...popular, ...fallback];
  }
}

// Create singleton instance
const popularItemsManager = new PopularItemsManager();

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { popularItemsManager, PopularItemsManager };
}
