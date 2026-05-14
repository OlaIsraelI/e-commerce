import { resetPassword } from "../../services/api/authApi.js";
import { showMessage } from "../../utils/ui.js";
import { getLoginPageHref } from "../../utils/navigation.js";

const form = document.getElementById("resetPasswordForm");
const submitBtn = form?.querySelector("button[type='submit']");
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (!token) {
  showMessage("Invalid or missing token.", "error");
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm-password");

  if (!password || !confirmPassword) {
    showMessage("All fields are required.", "error");
    return;
  }

  if (!PASSWORD_REGEX.test(String(password || ""))) {
    showMessage(
      "Password must be at least 8 characters and include at least one letter and one number.",
      "error",
    );
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Resetting password...";
    }

    const res = await resetPassword(token, { newPassword: password });

    showMessage(res.message || "Password reset successful!", "success");

    setTimeout(() => {
      window.location.href = getLoginPageHref();
    }, 1500);
  } catch (err) {
    showMessage(err.message || "Failed to reset password.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Reset Password";
    }
  }
});
