import { register } from "../../services/api/authApi.js";
import { showMessage } from "../../utils/ui.js";
import { redirectIfAuthenticated } from "../../utils/guard.js";
import { getVerifyAccountPageHref } from "../../utils/navigation.js";

const logPrefix = "[register-page]";
const PRIMARY_REDIRECT_DELAY_MS = 500;
const BACKUP_REDIRECT_DELAY_MS = 3000;

// Prevent logged-in users from accessing register page
const redirectPromise = redirectIfAuthenticated();

const form = document.getElementById("registerForm");
const submitBtn = form?.querySelector("button[type='submit']");
const PHONE_REGEX = /^(?:\+234|0)[789][01]\d{8}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

if (!form) {
  console.error("Register form not found");
}

console.log(`${logPrefix} form initialized`, {
  hasForm: !!form,
  hasSubmitBtn: !!submitBtn,
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      console.log(`${logPrefix} active service workers`, {
        count: registrations.length,
      });
      console.log(`${logPrefix} service worker controlling page`, {
        hasController: !!navigator.serviceWorker.controller,
      });
    })
    .catch((error) => {
      console.error(`${logPrefix} failed to inspect service workers`, error);
    });
} else {
  console.log(`${logPrefix} service worker API not supported in this browser`);
}

if (
  window.navigation &&
  typeof window.navigation.addEventListener === "function"
) {
  window.navigation.addEventListener("navigate", (event) => {
    console.log(`${logPrefix} navigation intercepted`, {
      destination: event.destination?.url || "unknown",
      canIntercept: event.canIntercept,
      userInitiated: event.userInitiated,
    });
  });
} else {
  console.log(`${logPrefix} navigation API not supported in this browser`);
}

const navigateWithFallbacks = (redirectUrl, phase) => {
  const methods = ["assign", "href", "replace"];

  for (const method of methods) {
    try {
      console.log(`${logPrefix} ${phase} redirect attempt`, {
        method,
        redirectUrl,
      });

      if (method === "assign") {
        window.location.assign(redirectUrl);
      } else if (method === "href") {
        window.location.href = redirectUrl;
      } else {
        window.location.replace(redirectUrl);
      }

      console.log(`${logPrefix} ${phase} redirect invoked`, { method });
      return method;
    } catch (error) {
      console.error(`${logPrefix} ${phase} redirect failed`, {
        method,
        error,
      });
    }
  }

  console.error(`${logPrefix} ${phase} redirect exhausted all methods`, {
    redirectUrl,
  });

  return null;
};

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  console.log(`${logPrefix} submit started`);

  const formData = new FormData(form);
  const name = formData.get("name");
  const email = formData.get("email");
  const number = formData.get("phone-number");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm-password");

  //Basic validation
  if (!name || !email || !password || !confirmPassword) {
    showMessage("All fields are required.", "error");
    return;
  }

  if (!PHONE_REGEX.test(String(number || "").trim())) {
    showMessage(
      "Enter a valid Nigerian phone number (e.g. 07064207988 or +2347064207988).",
      "error",
    );
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

  console.log(`${logPrefix} validation passed`, {
    name,
    email,
    number,
  });

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account...";
    }

    console.log(`${logPrefix} calling register API`);
    const res = await register({
      name,
      email,
      number,
      password,
    });

    console.log(`${logPrefix} register API response`, res);

    if (!res?.success) {
      throw new Error(res?.message || "Invalid server response");
    }

    showMessage(
      "✓ Registration successful! Check your email to verify your account.",
      "success",
      2500,
    );

    const redirectUrl = getVerifyAccountPageHref(email);
    console.log(`${logPrefix} scheduling redirect`, {
      redirectUrl,
      delayMs: PRIMARY_REDIRECT_DELAY_MS,
      backupDelayMs: BACKUP_REDIRECT_DELAY_MS,
    });

    const backupRedirectTimerId = window.setTimeout(() => {
      console.log(`${logPrefix} backup redirect timer fired`, {
        redirectUrl,
      });
      navigateWithFallbacks(redirectUrl, "backup");
    }, BACKUP_REDIRECT_DELAY_MS);

    window.addEventListener(
      "pagehide",
      () => {
        window.clearTimeout(backupRedirectTimerId);
        console.log(`${logPrefix} pagehide cleared backup redirect timer`);
      },
      { once: true },
    );

    setTimeout(() => {
      const methodUsed = navigateWithFallbacks(redirectUrl, "primary");
      console.log(`${logPrefix} primary redirect complete`, { methodUsed });
    }, PRIMARY_REDIRECT_DELAY_MS);
  } catch (error) {
    console.error("Registration error:", error);
    console.error(`${logPrefix} submit failed`, error);
    showMessage(error.message || "Registration failed.", "error");

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  }
});

await redirectPromise;
