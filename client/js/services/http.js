import ENV from "../config/env.js";
import { authService } from "./authService.js";
import { getLoginPageHref } from "../utils/navigation.js";

const refreshSession = async () => {
  const refreshToken = authService.getRefreshToken();

  const response = await fetch(`${ENV.BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {}),
    },
    ...(refreshToken ? { body: JSON.stringify({ refreshToken }) } : {}),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // If refresh fails, user session is invalid and needs to login
    authService.clearSession();
    throw new Error(data?.message || "Session expired");
  }

  // Store new tokens if provided
  if (data?.data?.accessToken) {
    authService.setAccessToken(data.data.accessToken);
  }
  if (data?.data?.refreshToken) {
    authService.setRefreshToken(data.data.refreshToken);
  }

  return data;
};

export const http = async (endpoint, options = {}) => {
  const accessToken = authService.getAccessToken();

  const config = {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  };

  if (options.body !== undefined) {
    config.body = options.body;
  }

  try {
    const res = await fetch(`${ENV.BASE_URL}${endpoint}`, config);
    let data = await res.json().catch(() => null);

    // Extract and store new tokens from response if present
    if (data?.data?.accessToken) {
      authService.setAccessToken(data.data.accessToken);
    }
    if (data?.data?.refreshToken) {
      authService.setRefreshToken(data.data.refreshToken);
    }

    if (res.status === 401 && !options.skipAuthRefresh && !options.__retried) {
      try {
        await refreshSession();
        // Retry the original request after successful refresh with new token
        const newAccessToken = authService.getAccessToken();
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            ...(newAccessToken
              ? { Authorization: `Bearer ${newAccessToken}` }
              : {}),
          },
        };

        const retryRes = await fetch(`${ENV.BASE_URL}${endpoint}`, retryConfig);
        data = await retryRes.json().catch(() => null);

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
