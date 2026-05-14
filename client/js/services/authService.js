import { getLoginPageHref } from "../utils/navigation.js";

const USER_KEY = "user";
const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const getApiBase = () => {
  if (window.location.protocol === "file:") {
    return "http://localhost:5000/api";
  }

  return `${window.location.origin}/api`;
};

export const authService = {
  setSession(user, accessToken, refreshToken) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setAccessToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },

  clearSession() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getUser() {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  },

  updateUser(partialUser) {
    const current = this.getUser() || {};
    const updated = { ...current, ...partialUser };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    return updated;
  },

  async logout() {
    try {
      await fetch(`${getApiBase()}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      });
    } finally {
      this.clearSession();
      window.location.href = getLoginPageHref();
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem(USER_KEY);
  },
};
