import { authService } from "../services/authService.js";
import { getLoginPageHref } from "./navigation.js";

export const logout = () => {
  authService.clearSession();

  // optional cleanup
  window.location.href = getLoginPageHref();
};
