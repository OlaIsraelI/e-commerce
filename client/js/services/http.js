import ENV from "../config/env.js";
import { authService } from "./authService.js";
import { csrfTokenManager } from "../utils/csrfToken.js";
import { getLoginPageHref } from "../utils/navigation.js";

/**
 * Refresh session by calling the refresh token endpoint
 * Tokens are stored in HTTP-only cookies and automatically sent with credentials: "include"
 * Server returns new tokens in Set-Cookie headers (HTTP-only)
 */
const refreshSession = async () => {
  const response = await fetch(`${ENV.BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // If refresh fails, user session is invalid and needs to login
    authService.clearSession();
    throw new Error(data?.message || "Session expired");
  }

  return data;
};

/**
 * HTTP utility for making authenticated requests
 * Security features:
 * - Uses HTTP-only cookies for token storage (automatic with credentials: "include")
 * - Automatically refreshes tokens on 401 responses
 * - Handles token rotation transparently
 * - Includes CSRF tokens on state-changing requests
 * - Never exposes tokens in JavaScript or network logs
 */
export const http = async (endpoint, options = {}) => {
  // Determine if this is a state-changing request that needs CSRF token
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(
    options.method || "GET",
  );

  const config = {
    method: options.method || "GET",
    credentials: "include", // Send cookies (HTTP-only tokens) with request
    headers: {
      "Content-Type": "application/json",
      // Add CSRF token for state-changing requests
      ...(isStateChanging && csrfTokenManager.getToken()
        ? { "X-CSRF-Token": csrfTokenManager.getToken() }
        : {}),
      ...(options.headers || {}),
    },
  };

  if (options.body !== undefined) {
    config.body = options.body;
  }

  try {
    const res = await fetch(`${ENV.BASE_URL}${endpoint}`, config);
    let data = await res.json().catch(() => null);

    // Extract and store any new CSRF token from response headers
    csrfTokenManager.handleResponseHeaders(res.headers);

    // If we get a 401 and we're allowed to refresh, try refreshing the token
    if (res.status === 401 && !options.skipAuthRefresh && !options.__retried) {
      try {
        await refreshSession();

        // Retry the original request with the new token (in cookies) and fresh CSRF token
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            // Get fresh CSRF token for retry
            ...(isStateChanging && csrfTokenManager.getToken()
              ? { "X-CSRF-Token": csrfTokenManager.getToken() }
              : {}),
          },
        };

        const retryRes = await fetch(`${ENV.BASE_URL}${endpoint}`, retryConfig);
        data = await retryRes.json().catch(() => null);

        // Extract CSRF token from retry response
        csrfTokenManager.handleResponseHeaders(retryRes.headers);

        if (!retryRes.ok) {
          throw new Error(data?.message || "An error occurred");
        }

        return data;
      } catch (error) {
        // Refresh failed - session is invalid
        authService.clearSession();
        window.location.href = getLoginPageHref();
        throw error;
      }
    }

    if (res.status === 401 && options.skipAuthRefresh) {
      throw new Error(data?.message || "Unauthorized");
    }

    if (!res.ok) {
      throw new Error(data?.message || "An error occurred");
    }

    return data;
  } catch (error) {
    throw new Error(error.message || "Network error");
  }
};
