# Authentication Token Issues - Fixed

## Problem Analysis

Your server logs showed an infinite loop of authentication errors:
- **GET /api/auth/me** → 401 "Not authorized, no token"
- **POST /api/auth/refresh** → 400 "Refresh token is required"

This occurred because:

1. **Session expiry flow was broken**: When a user's access token expired, the client attempted to refresh. However, if the refresh token was missing, the server returned 400 (Bad Request), not 401 (Unauthorized).

2. **No graceful degradation**: The client couldn't distinguish between "user not logged in" vs "session expired", causing redirect loops.

3. **Unnecessary API calls**: The guard system was making API calls even when the user clearly wasn't authenticated (no cached user).

## Changes Made

### 1. Server-side: `server/controllers/authController.js`
**Problem**: Refresh token endpoint returned 400 when token was missing, instead of 401.
**Fix**: Return 401 with a "Session expired" message and clear both cookies.

```javascript
// Before: threw 400 "Refresh token is required"
// After: returns 401 "Session expired. Please login again."
if (!token) {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
  throw new AppError("Session expired. Please login again.", 401);
}
```

**Benefit**: Client can properly detect session expiration vs. authentication failure.

### 2. Client-side: `client/js/services/http.js`
**Problem**: Failed refresh attempts didn't prevent repeated 401/400 cycles.
**Fix**: Properly handle failed refresh by clearing session and redirecting to login.

```javascript
// Before: had bare catch block that didn't clear session
// After: explicitly clears session before redirecting
catch (error) {
  authService.clearSession();
  window.location.href = getLoginPageHref();
  throw error;
}
```

**Benefit**: Prevents redirect loops and ensures user is logged out when session fails.

### 3. Client-side: `client/js/utils/guard.js`
**Problem**: Made unnecessary API calls for unauthenticated users.
**Fix**: Check localStorage cache first before making API call.

```javascript
// Before: always called getMe() API
// After: checks for cached user first
const cachedUser = authService.getUser();
if (!cachedUser) {
  throw new Error("No cached user");
}
```

**Benefit**: Reduces unnecessary 401 responses and API load.

## Testing Your Fix

After these changes, try:

1. **Access a protected page without logging in**: Should redirect to login (without error loop)
2. **Login and access protected page**: Should work normally
3. **Wait for access token to expire (15 min default)**: Should automatically refresh via refresh token
4. **Close browser (clearing refresh token)**: Should gracefully logout on next protected page access

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Still getting 401 errors | Ensure you've logged in first (access login page and login) |
| Cookies not persisting | Check browser privacy settings - allow cookies for localhost |
| Still seeing infinite loops | Clear browser cache/localStorage and login again |
| CORS errors in browser console | Ensure `credentials: 'include'` is in fetch requests (already fixed) |

## Cookie Configuration

Your cookie settings in `server/utils/cookies.js`:

- **Development** (NODE_ENV='development'):
  - httpOnly: true (secure from XSS)
  - secure: false (works with http://localhost)
  - sameSite: 'Lax' (allows basic cross-site requests)
  - Access Token: 15 minutes expiration
  - Refresh Token: 7 days expiration

- **Production** (NODE_ENV='production'):
  - httpOnly: true
  - secure: true (requires HTTPS)
  - sameSite: 'Strict' (maximum security)

## Next Steps

1. **Test the authentication flow** thoroughly
2. **Monitor server logs** for any remaining auth errors
3. **Implement token refresh UI**: Consider showing a "session expired" notification before redirect
4. **Add logout endpoint tracking**: Log when users are logged out due to session expiration

