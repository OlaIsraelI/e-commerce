import { resetPassword } from "../../services/api/authApi.js";
import { showMessage } from "../../utils/ui.js";
import { getLoginPageHref } from "../../utils/navigation.js";
import {
  validatePassword,
  doPasswordsMatch,
} from "../../utils/passwordValidator.js";
import { formatErrorMessage } from "../../utils/errorFormatter.js";

const form = document.getElementById("resetPasswordForm");
const submitBtn = form?.querySelector("button[type='submit']");

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
  showMessage(
    "Invalid reset link. Please request a new password reset.",
    "error",
  );
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm-password");

  // Field validation
  if (!password || !confirmPassword) {
    showMessage("All fields are required.", "error");
    return;
  }

  // Password strength validation
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    showMessage(passwordValidation.errors[0], "error");
    return;
  }

  // Password match validation
  const passwordMatch = doPasswordsMatch(password, confirmPassword);
  if (!passwordMatch.match) {
    showMessage(passwordMatch.error, "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Resetting password...";
    }

    const res = await resetPassword(token, { newPassword: password });

    showMessage(
      "✓ Password reset successful! Redirecting to login...",
      "success",
      2000,
    );

    setTimeout(() => {
      window.location.href = getLoginPageHref();
    }, 2000);
  } catch (err) {
    const friendlyMessage = formatErrorMessage(err.message);
    showMessage(friendlyMessage, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Reset Password";
    }
  }
});
