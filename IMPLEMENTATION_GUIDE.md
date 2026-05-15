# E-Commerce Authentication System - Complete Implementation Guide

**Last Updated:** May 15, 2026  
**Status:** ✅ FULLY SECURED & ENHANCED

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Security Implementation](#security-implementation)
3. [Frontend Features](#frontend-features)
4. [Backend Features](#backend-features)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Deployment Checklist](#deployment-checklist)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Flow

```
┌─────────────┐
│   Browser   │ (Session Storage: User Data)
├─────────────┤
│   HTTP      │ (HTTP-Only Cookies: Tokens)
├─────────────┤
│   Server    │ (Rate Limiting, CSRF, Session Management)
├─────────────┤
│  Database   │ (Hashed Tokens, User Data, Sessions)
└─────────────┘
```

### Authentication Flow

```
1. REGISTRATION
   └─→ Validate Input → Hash Password → Generate OTP → Send Email → Store Hashed OTP

2. EMAIL VERIFICATION
   └─→ Verify OTP → Mark Account Verified → Rate Limited (5 attempts/10 min)

3. LOGIN
   └─→ Find User → Verify Password → Create Session → Issue Tokens
       └─→ Access Token (15 min) + Refresh Token (7 days) in HTTP-Only Cookies

4. TOKEN REFRESH
   └─→ Validate Refresh Token → Generate New Tokens → Return in Cookies

5. PASSWORD RESET
   └─→ Generate Token → Hash Token → Send Email → User Resets → Verify Hash
```

---

## Security Implementation

### 🔒 Implemented Security Features

#### 1. **Token Management**

- ✅ HTTP-only cookies (JavaScript cannot access)
- ✅ Secure flag (HTTPS only in production)
- ✅ SameSite=Strict (production) / Lax (development)
- ✅ Token expiration (15 min access, 7 day refresh)
- ✅ No tokens in response body or request body

**Configuration:**

```javascript
// Access Token: 15 minutes
httpOnly: true;
secure: process.env.NODE_ENV === "production";
sameSite: "Strict"(production) / "Lax"(development);
maxAge: 15 * 60 * 1000;

// Refresh Token: 7 days
httpOnly: true;
secure: process.env.NODE_ENV === "production";
sameSite: "Strict"(production) / "Lax"(development);
maxAge: 7 * 24 * 60 * 60 * 1000;
```

#### 2. **Rate Limiting**

```
LOGIN:              5 attempts / 15 minutes
REGISTRATION:       5 accounts / 1 hour per IP
OTP VERIFY:         5 attempts / 10 minutes per email
OTP RESEND:         3 times / 5 minutes per email
FORGOT PASSWORD:    3 attempts / 1 hour per IP
RESET PASSWORD:     3 attempts / 1 hour per IP
GENERAL API:        100 requests / 15 minutes per IP
```

#### 3. **Account Lockout**

- **Failed Login:** 5 attempts → 30-minute lockout
- **OTP Verification:** 5 attempts → 15-minute lockout
- **Resend Cooldown:** 60 seconds between requests

#### 4. **Password Security**

- ✅ bcrypt hashing (12 salt rounds)
- ✅ Minimum 8 characters
- ✅ Require uppercase + lowercase + number
- ✅ Strength validation on client & server
- ✅ No password history (new feature)

#### 5. **CSRF Protection**

- ✅ Per-session tokens (1-hour expiry)
- ✅ One-time use (deleted after validation)
- ✅ Required on all state-changing requests (POST, PUT, PATCH, DELETE)
- ✅ Automatic extraction from response headers
- ✅ Included in X-CSRF-Token header

#### 6. **Security Headers**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: [detailed directives]
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-store (on auth endpoints)
```

#### 7. **Session Management**

- ✅ Max 5 concurrent sessions per user
- ✅ Automatic cleanup of old sessions
- ✅ Device/IP tracking per session
- ✅ Token version for invalidation
- ✅ Session-based logout capabilities

#### 8. **Error Handling**

- ✅ No information leakage in error messages
- ✅ Generic messages for failed auth
- ✅ Specific messages for validation errors
- ✅ Rate limit information in 429 responses

---

## Frontend Features

### Input Validation

**Email:**

- Pattern: `[email protected]`
- Normalized and lowercased
- Server-side validation with express-validator

**Password:**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Special characters recommended

**Phone (Nigerian):**

- Pattern: `(?:\+234|0)[789][01]\d{8}`
- Examples: `07064207988`, `+2347064207988`

**OTP:**

- Exactly 6 digits
- Numbers only
- Time-limited (10 minutes)
- Max 5 attempts

### User Experience

**Password Strength Indicator:**

```javascript
Weak (25%)    → Red     → Password too weak
Fair (50%)    → Yellow  → Some requirements met
Good (75%)    → Blue    → Most requirements met
Strong (100%) → Green   → All requirements met
```

**Real-time Feedback:**

- Password strength assessed as user types
- Specific improvement suggestions
- Password match validation
- Character count indicator

**Error Messages:**

- User-friendly translations of technical errors
- Actionable guidance (e.g., "Try again in 30 minutes")
- No exposure of system details

---

## Backend Features

### User Model Extensions

**New Fields:**

```javascript
failedLoginAttempts: Number; // Tracks failed login attempts
accountLockedUntil: Date; // Temporary lockout timestamp
otpLockedUntil: Date; // OTP verification lockout
otpAttempts: Number; // Failed OTP verification count
```

### Middleware Stack

**Rate Limiting:**

```javascript
authLimiter; // 5 attempts per 15 min (login/refresh)
registerLimiter; // 5 accounts per hour per IP
passwordResetLimiter; // 3 attempts per hour per IP
otpVerifyLimiter; // 5 attempts per 10 min per email
otpResendLimiter; // 3 times per 5 min per email
```

**Security Middleware:**

```javascript
helmet(); // Security headers
cors(); // CORS with credentials
cookieParser(); // HTTP-only cookie handling
csrfProtection(); // CSRF token validation
authMiddleware(); // JWT validation + session check
roleMiddleware(); // Role-based access control
```

### Enhanced Error Handling

```javascript
400: "Invalid request / Validation error"
401: "Unauthorized / Session expired"
403: "Forbidden / CSRF token invalid"
404: "Not found"
429: "Too many requests / Rate limited"
500: "Server error"
```

---

## Database Schema

### User Collection Structure

```javascript
{
  // Identification
  _id: ObjectId,
  email: String (unique, lowercase),
  name: String,
  phone: String,

  // Authentication
  password: String (hashed),
  isVerified: Boolean,
  role: String (user|admin),

  // Security
  tokenVersion: Number,
  failedLoginAttempts: Number,
  accountLockedUntil: Date,

  // OTP Management
  otp: String (hashed),
  otpExpires: Date,
  otpAttempts: Number,
  otpLastSent: Date,
  otpLockedUntil: Date,

  // Password Reset
  resetPasswordToken: String (hashed),
  resetPasswordExpires: Date,

  // Session Management
  sessions: [{
    sessionId: String (UUID),
    refreshToken: String (hashed),
    userAgent: String,
    ip: String,
    createdAt: Date
  }],

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Authentication Routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/verify-otp
POST   /api/auth/resend-otp
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me (protected)
PATCH  /api/auth/me (protected)
POST   /api/auth/logout (protected)
POST   /api/auth/logout-all (protected)
GET    /api/auth/sessions (protected)
DELETE /api/auth/account (protected)
```

### Rate Limits Applied

| Endpoint              | Limit | Window |
| --------------------- | ----- | ------ |
| POST /register        | 5     | 1 hour |
| POST /login           | 5     | 15 min |
| POST /verify-otp      | 5     | 10 min |
| POST /resend-otp      | 3     | 5 min  |
| POST /forgot-password | 3     | 1 hour |
| POST /reset-password  | 3     | 1 hour |
| POST /refresh         | 5     | 15 min |

---

## Deployment Checklist

### Pre-Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Set `JWT_SECRET` and `JWT_REFRESH_SECRET` (strong random values)
- [ ] Set `MONGO_URI` (production database)
- [ ] Set `CORS_ORIGIN` (allowed domains)
- [ ] Configure email service credentials
- [ ] Generate SSL/TLS certificates
- [ ] Set up HTTPS
- [ ] Enable HSTS headers

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-random-32-chars>
JWT_REFRESH_SECRET=<strong-random-32-chars>

# CORS
CORS_ORIGIN=https://yourdomain.com

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Security Configuration

```bash
# SSL/TLS
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# CSRF
CSRF_ENABLED=true
CSRF_TOKEN_EXPIRY=3600000 # 1 hour

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000 # 15 minutes
RATE_LIMIT_MAX=100
```

### Production Verification

```bash
# Test HTTPS
curl -I https://yourdomain.com/api/auth/login

# Test Security Headers
curl -I https://yourdomain.com | grep -i "strict-transport-security"
curl -I https://yourdomain.com | grep -i "x-frame-options"

# Test Rate Limiting
for i in {1..10}; do
  curl -X POST https://yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Should return 429 after 5 requests
```

---

## Testing Guide

### Manual Testing

#### Test 1: Registration Flow

```bash
1. Navigate to /register
2. Enter valid data:
   Name: Test User
   Email: test@example.com
   Phone: 07064207988
   Password: TestPassword123
   Confirm: TestPassword123
3. Submit form
4. Check email for OTP
5. Enter OTP on verification page
6. Should redirect to login
```

#### Test 2: Login Flow

```bash
1. Navigate to /login
2. Enter credentials:
   Email: test@example.com
   Password: TestPassword123
3. Should redirect to dashboard
4. Token should be in HTTP-only cookie
5. Check developer tools → Application → Cookies
```

#### Test 3: Rate Limiting

```bash
1. Try login with wrong password 5+ times
2. After 5 attempts, should see: "Account locked for 30 minutes"
3. Try password reset instead
4. Reset should work (different rate limit)
```

#### Test 4: Password Reset

```bash
1. Click "Forgot Password"
2. Enter email
3. Check email for reset link
4. Click link
5. Enter new password with strength validation
6. Should redirect to login
7. Login with new password
```

#### Test 5: CSRF Protection

```bash
1. Open developer tools → Network tab
2. Try to update profile
3. Check request headers for X-CSRF-Token
4. Token should be present on all state-changing requests
```

### Automated Testing

```bash
# Test Password Validation
npm run test:password-validation

# Test Error Handling
npm run test:error-formatter

# Test CSRF Token Management
npm run test:csrf-tokens

# Test Rate Limiting
npm run test:rate-limiting

# Integration Tests
npm run test:integration
```

---

## Troubleshooting

### Issue: "Session expired" on every request

**Cause:** Token expiration too short  
**Solution:**

```javascript
// Increase token expiry in utils/jwt.js
expiresIn: "30m"; // was 15m
```

### Issue: CSRF token validation failures

**Cause:** Token not being extracted from response  
**Solution:**

```javascript
// Ensure csrfTokenManager.handleResponseHeaders() is called
csrfTokenManager.handleResponseHeaders(res.headers);
```

### Issue: Rate limiting too strict

**Cause:** Global rate limit interfering with auth limits  
**Solution:**

```javascript
// Use specific limiters for auth endpoints
router.post("/login", authLimiter, loginValidation, validate, login);
// Not the global API limiter
```

### Issue: Tokens not being set in cookies

**Cause:** Credentials not included in fetch  
**Solution:**

```javascript
// Ensure credentials: "include" in fetch
fetch(url, {
  method: "POST",
  credentials: "include", // Must be present
  headers: { "Content-Type": "application/json" },
});
```

### Issue: "Invalid or expired OTP" on correct OTP

**Cause:** OTP already hashed, comparing wrong values  
**Solution:**

```javascript
// OTP must be hashed before comparison
if (user.otp !== hashOTP(otp)) {
  // Fail
}
```

### Issue: Refresh token not refreshing

**Cause:** Token not in cookies, trying to use body  
**Solution:**

```javascript
// Only read from cookies
const token = req.cookies?.refreshToken;
// NOT: const token = req.cookies?.refreshToken || req.body.refreshToken;
```

---

## Performance Optimization

### Database Indexes

```javascript
// Add these indexes for better performance
User.collection.createIndex({ email: 1 });
User.collection.createIndex({ createdAt: 1 });
User.collection.createIndex({ accountLockedUntil: 1 });
User.collection.createIndex({ "sessions.sessionId": 1 });
```

### Caching Strategy

```javascript
// Cache user data for 5 minutes (except on sensitive operations)
const CACHE_TTL = 5 * 60 * 1000;

// Invalidate on:
// - Password change
// - Email change
// - Role change
```

### Load Balancing

```nginx
# Use sticky sessions to prevent CSRF token loss
upstream app {
  server app1.example.com weight=1 max_fails=3 fail_timeout=30s;
  server app2.example.com weight=1 max_fails=3 fail_timeout=30s;
}

# Session affinity (for distributed CSRF token store, use Redis)
proxy_cookie_flags ~ ^(sessionid|csrftoken)=.+$ secure httponly samesite=strict;
```

---

## Monitoring & Logging

### Key Metrics to Monitor

- Failed login attempts per user
- Rate limit violations per IP
- OTP verification failures
- Password reset requests
- Session creation/deletion
- Token refresh frequency
- CSRF token validation failures

### Sample Logging

```javascript
console.log("[auth/login] success", {
  userId: user._id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get("user-agent"),
  timestamp: new Date().toISOString(),
});

console.error("[auth/login] failure", {
  email: req.body.email,
  reason: "invalid_credentials",
  attempts: user.failedLoginAttempts,
  ip: req.ip,
  timestamp: new Date().toISOString(),
});
```

---

## Production Hardening

### Additional Security Measures

1. **Web Application Firewall (WAF)**
   - Use Cloudflare, AWS WAF, or similar
   - Rules for SQL injection, XSS, etc.

2. **DDoS Protection**
   - Enable DDoS mitigation service
   - Set up rate limiting at edge level

3. **Certificate Management**
   - Auto-renewal via Let's Encrypt
   - Monitor certificate expiration

4. **Secrets Management**
   - Use AWS Secrets Manager or HashiCorp Vault
   - Rotate secrets regularly

5. **Monitoring & Alerting**
   - Set up alerts for failed logins
   - Alert on rate limit violations
   - Monitor for suspicious patterns

6. **Backup & Recovery**
   - Daily automated backups
   - Test recovery procedures
   - Document RTO/RPO

---

## Summary

Your e-commerce authentication system now features:

✅ **Security First:**

- HTTP-only cookie-based tokens
- Rate limiting on all auth endpoints
- Account & OTP lockout mechanisms
- CSRF protection
- Enhanced security headers

✅ **User Friendly:**

- Real-time password strength feedback
- User-friendly error messages
- Smooth token refresh
- Clear success/failure states

✅ **Production Ready:**

- Comprehensive error handling
- Session management
- Security audit logging
- Deployment guidelines

✅ **Maintainable:**

- Centralized utilities
- Clear code comments
- Modular middleware
- Well-documented API

**Status: READY FOR PRODUCTION DEPLOYMENT**

---

Generated: May 15, 2026
