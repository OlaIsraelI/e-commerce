export const ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    VERIFY_OTP: "/auth/verify-otp",
    RESEND_OTP: "/auth/resend-otp",
    LOGIN: "/auth/login",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  PRODUCTS: {
    GET_ALL: "/products",
    GET_ONE: (id) => `/products/${id}`,
  },
};
