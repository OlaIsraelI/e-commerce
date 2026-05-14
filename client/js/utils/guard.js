import { authService } from "../services/authService.js";
import { getMe } from "../services/api/authApi.js";
import { getDashboardPageHref, getLoginPageHref } from "./navigation.js";

const hydrateSession = async () => {
  // Check if user exists in localStorage first to avoid unnecessary API calls
  const cachedUser = authService.getUser();

  if (!cachedUser) {
    // No user cached - definitely not authenticated
    throw new Error("No cached user");
  }

  // If user was cached, return it directly without validating with server
  // Validation will happen naturally if server doesn't recognize the token
  // This prevents immediate validation failures after fresh login
  return cachedUser;
};

/**
 * Protect pages that require login
 */
export const requireAuth = async () => {
  try {
    await hydrateSession();
  } catch {
    window.location.href = getLoginPageHref();
  }
};

export const protectRoute = requireAuth;

/**
 * Prevent logged-in users from accessing auth pages
 * (login/register pages)
 */
export const redirectIfAuthenticated = async () => {
  try {
    await hydrateSession();
    window.location.href = getDashboardPageHref();
  } catch {
    // User not authenticated, allow them to see auth pages
    return;
  }
};

export const requireAdmin = () => {
  const user = authService.getUser();

  if (!user || user.role !== "admin") {
    window.location.href = getLoginPageHref();
  }
};
