/**
 * CSRF Token Management Utility
 * Handles generation, storage, and inclusion of CSRF tokens in requests
 */

const CSRF_TOKEN_KEY = "csrfToken";
const CSRF_TOKEN_HEADER = "X-CSRF-Token";

export const csrfTokenManager = {
  /**
   * Store CSRF token received from server
   * Server sends tokens in X-CSRF-Token response header
   */
  setToken(token) {
    if (token) {
      sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    }
  },

  /**
   * Get stored CSRF token
   */
  getToken() {
    return sessionStorage.getItem(CSRF_TOKEN_KEY);
  },

  /**
   * Clear stored CSRF token
   */
  clearToken() {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  },

  /**
   * Get headers object with CSRF token
   * Used for state-changing requests (POST, PUT, PATCH, DELETE)
   */
  getHeaders() {
    const token = this.getToken();
    return token ? { [CSRF_TOKEN_HEADER]: token } : {};
  },

  /**
   * Intercept fetch response to extract and store new CSRF token
   * Server may send fresh token in each response
   */
  handleResponseHeaders(headers) {
    const token = headers.get(CSRF_TOKEN_HEADER);
    if (token) {
      this.setToken(token);
    }
  },
};
