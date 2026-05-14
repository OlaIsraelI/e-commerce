import { verifyOtp, resendOtp } from "../../services/api/authApi.js";
import { showMessage } from "../../utils/ui.js";
import { getLoginPageHref } from "../../utils/navigation.js";

const form = document.getElementById("verifyAccountForm");
const submitBtn = form?.querySelector("button[type='submit']");
const resendLink = document.getElementById("resendOtpLink");
const emailInput = document.getElementById("email");

const params = new URLSearchParams(window.location.search);
const emailFromQuery = params.get("email");

if (emailInput && emailFromQuery) {
  emailInput.value = emailFromQuery;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const otp = String(formData.get("otp") || "").trim();

  if (!email || !otp) {
    showMessage("Email and OTP are required.", "error");
    return;
  }

  if (otp.length !== 6) {
    showMessage("OTP must be 6 digits.", "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying...";
    }

    const res = await verifyOtp({ email, otp });

    showMessage(res?.message || "Account verified successfully!", "success");

    setTimeout(() => {
      window.location.href = getLoginPageHref();
    }, 900);
  } catch (error) {
    showMessage(error.message || "Verification failed.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify Account";
    }
  }
});

resendLink?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = String(emailInput?.value || "").trim();

  if (!email) {
    showMessage("Enter your email first.", "error");
    return;
  }

  try {
    await resendOtp({ email });
    showMessage("OTP sent. Check your inbox.", "success");
  } catch (error) {
    showMessage(error.message || "Failed to resend OTP.", "error");
  }
});
