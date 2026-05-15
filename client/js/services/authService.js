import { getLoginPageHref } from "../utils/navigation.js";

// Storage keys
const USER_KEY = "user";
const SESSION_VALIDATION_KEY = "sessionValidated";

const getApiBase = () => {
  if (window.location.protocol === "file:") {
    return "http://localhost:5000/api";
  }

  return `${window.location.origin}/api`;
};

/**
 * Auth Service - Manages authentication state
 * Security: Tokens are stored in HTTP-only cookies set by the server.
 * User data is stored in localStorage for UI state only.
 * Tokens should never be accessed by JavaScript for security.
 */
export const authService = {
  /**
   * Sets the user session (user data stored in localStorage for UI purposes only)
   * Tokens are automatically set in HTTP-only cookies by the server
   */
  setSession(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      // Mark session as validated to prevent automatic logout on page reload
      localStorage.setItem(SESSION_VALIDATION_KEY, "true");
    }
  },

  /**
   * Clears the session and user data
   * Tokens are cleared by server via Set-Cookie with Max-Age=0
   */
  clearSession() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_VALIDATION_KEY);
  },

  /**
   * Gets the current user from localStorage
   * Returns null if no user is logged in
   */
  getUser() {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  },

  /**
   * Updates the current user in localStorage
   * For UI state updates only - never contains tokens
   */
  updateUser(partialUser) {
    const current = this.getUser() || {};
    const updated = { ...current, ...partialUser };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Checks if user has a valid session
   * Based on user data in localStorage (tokens are in HTTP-only cookies)
   */
  isAuthenticated() {
    return !!localStorage.getItem(USER_KEY);
  },

  /**
   * Checks if the session was validated (prevents logout on page reload)
   */
  isSessionValidated() {
    return localStorage.getItem(SESSION_VALIDATION_KEY) === "true";
  },

  /**
   * Logs out the user by calling the server logout endpoint
   * Server clears HTTP-only cookies
   */
  async logout() {
    try {
      await fetch(`${getApiBase()}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } finally {
      this.clearSession();
      window.location.href = getLoginPageHref();
    }
  },
};
