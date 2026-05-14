# Client Architecture Guide

This app is a vanilla HTML/CSS/JavaScript frontend. The goal is to keep the runtime simple, predictable, and easy to scale as the product grows.

## Recommended Structure

    components/
      shared/

```text
client/
  assets/
    css/
      global.css
      auth.css
      dashboard.css
      profile.css
      menu.css
      ui.css
    images/
    icons/
    fonts/
  components/
    shared/
      header.js
      footer.js
      nav.js
      modal.js
    forms/
      formField.js
      passwordStrength.js
  pages/
    auth/
      login.html
      register.html
      verify-account.html
      forgot-password.html
      reset-password.html
    dashboard/
      dashboard.html
    profile/
      profile.html
    view/
      categories.html
      shopping.html
      wishlist.html
      checkout.html
      menu.html
      contact.html
  js/
    config/
      env.js
      endpoints.js
    services/
      http.js
      authService.js
      productService.js
      orderService.js
      userService.js
      cartStore.js
      api/
        authApi.js
    utils/
      navigation.js
      guard.js
      storage.js
      ui.js
      logout.js
      validators.js
    features/
      auth/
        register.js
        login.js
        verifyaccount.js
        resetpassword.js
        forgotpassword.js
      profile/
        profile.js
      dashboard/
        dashboard.js
      commerce/
        cart.js
        shopping.js
        wishlist.js
        checkout.js
        menu.js
    controllers/
      authController.js
      profileController.js
      checkoutController.js
```

## What Was Improved

- Redirect path logic is now centralized in `client/js/utils/navigation.js`.
- Shared global UI wiring now lives in `client/js/components/shared/` instead of `main.js`.
- Menu-card behavior now lives in `client/js/features/commerce/menu.js` instead of a standalone page script.
- Auth page scripts stay page-scoped, while shared navigation and session behavior live in utilities and services.
- Duplicate login/logout redirect strings are removed from multiple files.

## Deleted Client Files

- `client/js/context/AuthContext.jsx`
- `client/js/routes/ProtectedRoute.jsx`
- `client/js/routes/index.jsx`
- `client/js/guards.js`
- `client/js/middleware/authGuard.js`
- `client/js/handlers/errorHandler.js`
- `client/js/pages/cart.js`
- `client/js/pages/products.js`
- `client/js/pages/auth/`
- `client/js/pages/profile/`

These files and empty directories were removed because the client runtime now uses `client/js/features/`, `client/js/components/shared/`, `client/js/utils/`, and `client/js/services/` as the active layers.

## Optional Follow-Up Improvements

- Add import aliases so `../../services/...` style paths become shorter and more stable.
- Introduce a lint/format step to keep page scripts, services, and utilities aligned.
- Split page scripts by feature and keep all redirects in `utils/navigation.js`.
- Keep feature scripts isolated and continue moving any new page-level behavior into `client/js/features/`.
