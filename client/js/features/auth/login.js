import { login } from "../../services/api/authApi.js";
import { authService } from "../../services/authService.js";
import { showMessage } from "../../utils/ui.js";
import { redirectIfAuthenticated } from "../../utils/guard.js";
import { formatErrorMessage } from "../../utils/errorFormatter.js";

// Prevent logged-in users from accessing login page
const redirectPromise = redirectIfAuthenticated();

const form = document.getElementById("loginForm");
const submitBtn = form?.querySelector("button[type='submit']");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const email = formData.get("email")?.trim();
  const password = formData.get("password");

  // Client-side validation
  if (!email || !password) {
    showMessage("Email and password are required.", "error");
    return;
  }

  if (!email.includes("@")) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  try {
    // Loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";
    }

    const res = await login({ email, password });

    const user = res?.data?.user;

    if (!user) {
      throw new Error("Invalid server response");
    }

    // Store user session locally (tokens are in HTTP-only cookies set by server)
    authService.setSession(user);

    showMessage(
      "✓ Login successful! Redirecting to your dashboard...",
      "success",
      2000,
    );

    // Redirect
    setTimeout(() => {
      window.location.href = "../../pages/dashboard/dashboard.html";
    }, 2000);
  } catch (error) {
    const friendlyMessage = formatErrorMessage(error.message);
    showMessage(friendlyMessage, "error");

    // Log error details for debugging (don't expose to user)
    console.error("[login] error:", error);
  } finally {
    // Reset button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }
  }
});

await redirectPromise;
