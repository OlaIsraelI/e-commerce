import { http } from "../http.js";
import { ENDPOINTS } from "../../config/endpoints.js";

export const register = (data) =>
  http(ENDPOINTS.AUTH.REGISTER, {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify(data),
  });

export const verifyOtp = (data) =>
  http(ENDPOINTS.AUTH.VERIFY_OTP, {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify(data),
  });

export const resendOtp = (data) =>
  http(ENDPOINTS.AUTH.RESEND_OTP, {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify(data),
  });

export const login = (data) =>
  http(ENDPOINTS.AUTH.LOGIN, {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify(data),
  });

export const getMe = () =>
  http(ENDPOINTS.AUTH.ME, {
    method: "GET",
  });

export const updateMe = (data) =>
  http(ENDPOINTS.AUTH.ME, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const forgotPassword = (data) =>
  http(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify(data),
  });

export const resetPassword = (token, data) =>
  http(ENDPOINTS.AUTH.RESET_PASSWORD, {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify({ token, newPassword: data.newPassword }),
  });
