import { verifyOtp, resendOtp } from "../../services/api/authApi.js";
import { showMessage } from "../../utils/ui.js";
import { getLoginPageHref } from "../../utils/navigation.js";
import { formatErrorMessage } from "../../utils/errorFormatter.js";

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

  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    showMessage("OTP must be exactly 6 digits.", "error");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying...";
    }

    const res = await verifyOtp({ email, otp });

    showMessage(
      "✓ Account verified successfully! Redirecting to login...",
      "success",
      1500,
    );

    setTimeout(() => {
      window.location.href = getLoginPageHref();
    }, 1500);
  } catch (error) {
    const friendlyMessage = formatErrorMessage(error.message);
    showMessage(friendlyMessage, "error");
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
    showMessage("Please enter your email address.", "error");
    return;
  }

  if (!email.includes("@")) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  try {
    // Disable resend link during request
    resendLink.classList.add("disabled");
    resendLink.style.pointerEvents = "none";
    resendLink.style.opacity = "0.5";

    await resendOtp({ email });
    showMessage("✓ OTP sent! Check your inbox.", "success", 2000);
  } catch (error) {
    const friendlyMessage = formatErrorMessage(error.message);
    showMessage(friendlyMessage, "error");
  } finally {
    // Re-enable resend link
    resendLink.classList.remove("disabled");
    resendLink.style.pointerEvents = "auto";
    resendLink.style.opacity = "1";
  }
});
