import { forgotPassword } from "../../services/api/authApi.js";
import { showMessage } from "../../utils/ui.js";
import { formatErrorMessage } from "../../utils/errorFormatter.js";

const form = document.getElementById("forgotPasswordForm");
const submitBtn = form?.querySelector("button[type='submit']");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const email = formData.get("email")?.trim();

  if (!email) {
    showMessage("Please enter your email address.", "error");
    return;
  }

  if (!email.includes("@")) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending reset link...";
    }

    const res = await forgotPassword({ email });

    showMessage(
      "✓ Password reset link sent successfully! Check your email.",
      "success",
      3000,
    );

    // Clear the form
    form.reset();
  } catch (error) {
    const friendlyMessage = formatErrorMessage(error.message);
    showMessage(friendlyMessage, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Reset Link";
    }
  }
});
