# Frontend Authentication Quick Reference Guide

**For Developers Working on Auth Features**

---

## 🔐 Security-First Checklist

When adding auth features, always:

- [ ] Use HTTP-only cookies for tokens (never localStorage)
- [ ] Include X-CSRF-Token header on state-changing requests
- [ ] Validate input on client & server
- [ ] Use error formatter for user-friendly messages
- [ ] Don't expose sensitive info in error messages
- [ ] Test with rate limiting in mind
- [ ] Handle 401 responses with automatic token refresh

---

## 🛠 Quick Code Snippets

### 1. Import Error Formatter

```javascript
import { formatErrorMessage } from "../../utils/errorFormatter.js";

try {
  await login({ email, password });
} catch (error) {
  const friendlyMsg = formatErrorMessage(error.message);
  showMessage(friendlyMsg, "error");
}
```

### 2. Import Password Validator

```javascript
import {
  validatePassword,
  doPasswordsMatch,
} from "../../utils/passwordValidator.js";

const validation = validatePassword(userPassword);
if (!validation.valid) {
  showMessage(validation.errors[0], "error");
  return;
}

const match = doPasswordsMatch(password, confirmPassword);
if (!match.match) {
  showMessage(match.error, "error");
  return;
}
```

### 3. CSRF Token Handling (Automatic)

```javascript
// In http.js - happens automatically
// 1. Extracts token from response headers
// 2. Includes token in request headers for POST/PUT/PATCH/DELETE
// 3. No manual handling needed in components
```

### 4. Handle Rate Limit Errors

```javascript
import { isRateLimitError } from "../../utils/errorFormatter.js";

catch (error) {
  if (isRateLimitError(error.message)) {
    // User hit rate limit
    showMessage(formatErrorMessage(error.message), "error");
    // Don't retry automatically
  }
}
```

### 5. Session Validation

```javascript
import { authService } from "../../services/authService.js";

// Check if user is still logged in
const isLoggedIn = !!authService.getUser();

// Get current user data
const user = authService.getUser();
console.log(user); // { name, email, role, ... }
```

---

## 📋 Error Message Reference

### Common Error Mappings

```
Technical Error → User Message

"Invalid credentials"
→ "Email or password is incorrect."

"Too many login attempts"
→ "Too many failed attempts. Try again in 30 minutes or reset password."

"Invalid or expired OTP"
→ "Verification code invalid or expired. Request a new code."

"Session expired"
→ "Your session has expired. Please login again."

"CSRF token missing or invalid"
→ "Security error. Refresh page and try again."

"Account locked"
→ "Account locked for security. Try again in 30 minutes or reset password."

"Network error"
→ "Connection lost. Check internet and try again."
```

See `client/js/utils/errorFormatter.js` for complete list.

---

## 🔑 Rate Limit Rules

**You don't need to implement rate limiting in frontend** - it's handled by server. But be aware:

| Endpoint        | Limit               | Action                                 |
| --------------- | ------------------- | -------------------------------------- |
| Login           | 5 attempts / 15 min | Account locked 30 min after 5 failures |
| Register        | 5 accounts / 1 hour | IP blocked for 1 hour                  |
| OTP Verify      | 5 attempts / 10 min | Account locked 15 min after 5 failures |
| OTP Resend      | 3 times / 5 min     | 60-second cooldown between requests    |
| Forgot Password | 3 attempts / 1 hour | IP blocked for 1 hour                  |

**What to do when user hits rate limit:**

1. Display formatted error message
2. Don't retry automatically
3. Suggest alternative actions (e.g., "Reset password instead")

---

## 🎨 Password Strength Levels

```javascript
const validation = validatePassword(password);

// Returns object with:
{
  valid: Boolean,              // false if any requirements not met
  strength: String,            // "weak", "fair", "good", "strong"
  score: Number,               // 0-100
  errors: String[],            // ["too short", "needs uppercase", ...]
  warnings: String[],          // ["avoid repeating chars"]
  feedback: String             // "Add 3 more characters"
}

// Use in UI:
const color = {
  "weak": "#dc2626",    // red
  "fair": "#f59e0b",    // amber
  "good": "#3b82f6",    // blue
  "strong": "#10b981"   // green
}[validation.strength];
```

---

## 🔄 Token Refresh (Automatic)

The `http.js` service handles token refresh automatically:

```javascript
// When token expires:
// 1. Server returns 401 Unauthorized
// 2. http.js automatically calls /api/auth/refresh
// 3. New tokens set in HTTP-only cookies
// 4. Original request retried with new token
// 5. If refresh fails → user redirected to login

// In your code, just catch errors normally:
try {
  await http.post("/api/protected", data);
} catch (error) {
  // If still getting 401 here, token refresh failed
  // User will be redirected to login
}
```

---

## 📱 Form Input Validation Patterns

### Email

```javascript
if (!email.includes("@")) {
  showMessage("Please enter a valid email address.", "error");
  return;
}
```

### Phone (Nigerian)

```javascript
const PHONE_REGEX = /^(?:\+234|0)[789][01]\d{8}$/;

if (!PHONE_REGEX.test(phone)) {
  showMessage(
    "Enter valid Nigerian phone (e.g., 07064207988 or +2347064207988).",
    "error",
  );
  return;
}
```

### OTP (6 digits)

```javascript
if (otp.length !== 6 || !/^\d+$/.test(otp)) {
  showMessage("OTP must be exactly 6 digits.", "error");
  return;
}
```

### Password

```javascript
import { validatePassword } from "../../utils/passwordValidator.js";

const validation = validatePassword(password);
if (!validation.valid) {
  showMessage(validation.errors[0], "error");
  return;
}
```

---

## 🔍 Debugging Authentication Issues

### Check Token in Cookie

```javascript
// Open DevTools → Application → Cookies → find:
// - accessToken (15 min expiry)
// - refreshToken (7 day expiry)
// Both should have: HttpOnly ✓, Secure ✓, SameSite=Strict ✓
```

### Check CSRF Token

```javascript
// Check browser sessionStorage:
sessionStorage.getItem("csrfToken"); // Should exist after login

// Check request headers in Network tab:
// X-CSRF-Token: [token] // Should be present on POST/PUT/PATCH/DELETE
```

### Check User Session

```javascript
// In console:
import { authService } from "../../services/authService.js";
authService.getUser(); // Should return { name, email, role, ... }
```

### Enable Debug Logging

```javascript
// Check browser console for logs:
// [register-page] form initialized
// [register-page] submit started
// [register-page] validation passed
// [register-page] calling register API
// [register-page] register API response
// [auth-service] session set
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't: Store tokens in localStorage

```javascript
// WRONG
localStorage.setItem("token", accessToken);
const token = localStorage.getItem("token");
```

### ✅ Do: Let cookies handle it automatically

```javascript
// RIGHT - tokens are in HTTP-only cookies
// No need to store or retrieve manually
await http.post("/api/protected", data);
// HTTP service automatically includes cookies
```

---

### ❌ Don't: Send tokens in request body

```javascript
// WRONG
const response = await fetch("/api/auth/refresh", {
  method: "POST",
  body: JSON.stringify({
    refreshToken: getStoredToken(), // ❌ EXPOSED IN LOGS
  }),
});
```

### ✅ Do: Use cookies only

```javascript
// RIGHT
const response = await http.post("/api/auth/refresh");
// Token automatically sent in cookies
// Credentials: include set in http.js
```

---

### ❌ Don't: Expose error details to user

```javascript
// WRONG
showMessage(`Login failed: ${error.message}`, "error");
// Might show: "User with email test@test.com does not exist"
// ❌ Information leak - helps attackers
```

### ✅ Do: Use error formatter

```javascript
// RIGHT
const friendlyMsg = formatErrorMessage(error.message);
showMessage(friendlyMsg, "error");
// Shows: "Email or password is incorrect."
// ✅ Generic message - no info leak
```

---

### ❌ Don't: Retry rate-limited requests

```javascript
// WRONG
try {
  await login(credentials);
} catch (error) {
  // Retry after 1 second ❌
  setTimeout(() => login(credentials), 1000);
}
```

### ✅ Do: Detect and inform user

```javascript
// RIGHT
try {
  await login(credentials);
} catch (error) {
  const msg = formatErrorMessage(error.message);
  if (isRateLimitError(error.message)) {
    showMessage(msg + " Please wait before trying again.", "error");
  } else {
    showMessage(msg, "error");
  }
}
```

---

## 📚 Documentation Files

- **IMPLEMENTATION_GUIDE.md** - Complete setup and deployment guide
- **FRONTEND_IMPROVEMENTS.md** - All frontend features explained
- **SECURITY_AUDIT_REPORT.md** - Security fixes and details
- **This file** - Developer quick reference

---

## 🤔 FAQ

**Q: Why can't I see tokens in localStorage?**  
A: Tokens are stored in HTTP-only cookies (secure by design). JavaScript can't access them, preventing XSS attacks.

**Q: My token keeps expiring. What should I do?**  
A: The http.js service automatically refreshes it. If still failing after refresh, user is redirected to login.

**Q: How do I handle 401 errors?**  
A: The http.js service handles them automatically. Just catch errors normally in your code.

**Q: Where should I use error formatter?**  
A: In every auth-related try-catch block before showing error to user.

**Q: How do I validate passwords?**  
A: Use the validatePassword() utility in register and reset password pages.

**Q: What if user closes browser with unsaved form?**  
A: CSRF token is cleared (sessionStorage), which is fine. They'll get fresh token on next login.

---

## 🚀 Quick Start: Add Auth to New Component

```javascript
import { formatErrorMessage } from "../../utils/errorFormatter.js";
import { validatePassword } from "../../utils/passwordValidator.js";
import { showMessage } from "../../utils/ui.js";

const form = document.getElementById("myForm");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = form.querySelector('input[name="password"]').value;

  // Validate password
  const validation = validatePassword(password);
  if (!validation.valid) {
    showMessage(validation.errors[0], "error");
    return;
  }

  try {
    // Make API call (includes CSRF token automatically)
    const response = await http.post("/api/auth/update", { password });
    showMessage("✓ Password updated successfully!", "success");
  } catch (error) {
    // Convert error to user-friendly message
    const friendlyMsg = formatErrorMessage(error.message);
    showMessage(friendlyMsg, "error");
  }
});
```

That's it! You've:
✅ Validated input  
✅ Handled errors gracefully  
✅ Used CSRF tokens automatically  
✅ Shown user-friendly messages

---

Generated: May 15, 2026
