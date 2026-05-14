import { login } from "../../services/api/authApi.js";
import { authService } from "../../services/authService.js";
import { showMessage } from "../../utils/ui.js";
import { redirectIfAuthenticated } from "../../utils/guard.js";

// Prevent logged-in users from accessing login page
const redirectPromise = redirectIfAuthenticated();

const form = document.getElementById("loginForm");
const submitBtn = form?.querySelector("button[type='submit']");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const email = formData.get("email");
  const password = formData.get("password");

  //Basic validation
  if (!email || !password) {
    showMessage("Email and password are required.", "error");
    return;
  }

  try {
    //Loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Logging in...";
    }

    const res = await login({ email, password });

    const user = res?.data?.user;

    if (!user) {
      throw new Error("Invalid server response");
    }

    // Store session data locally with tokens for fallback auth
    const accessToken = res?.data?.accessToken;
    const refreshToken = res?.data?.refreshToken;
    authService.setSession(user, accessToken, refreshToken);

    showMessage(
      "Login successful! Redirecting to your dashboard...",
      "success",
      2000,
    );

    //Redirect
    setTimeout(() => {
      window.location.href = "../../pages/dashboard/dashboard.html";
    }, 2000);
  } catch (error) {
    showMessage(error.message || "Invalid email or password.", "error");
  } finally {
    //Reset button state
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }
  }
});

await redirectPromise;
