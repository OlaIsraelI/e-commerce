import { forgotPassword } from "../../services/api/authApi.js";
import { showMessage } from "../../utils/ui.js";

const form = document.getElementById("forgotPasswordForm");
const submitBtn = form?.querySelector("button[type='submit']");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const email = formData.get("email")?.trim();

  if (!email) {
    showMessage("Please enter your email.", "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending link...";
    }

    const res = await forgotPassword({ email });

    showMessage(
      res.message || "Password reset email sent successfully!",
      "success",
    );
  } catch (error) {
    showMessage(
      error.message || "Failed to send password reset email.",
      "error",
    );
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Reset Link";
    }
  }
});
