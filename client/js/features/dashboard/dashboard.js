import { authService } from "../../services/authService.js";
import { protectRoute } from "../../utils/guard.js";
import { showMessage } from "../../utils/ui.js";

await protectRoute();

const user = authService.getUser();

const welcomeText = document.getElementById("welcomeText");
const logoutBtn = document.getElementById("logoutBtn");

if (user) {
  const displayName = user.name || user.email || "there";
  welcomeText.textContent = `Welcome back, ${displayName}`;
} else {
  welcomeText.textContent = "Welcome back";
}

logoutBtn?.addEventListener("click", () => {
  showMessage("Logged out successfully", "success");
  setTimeout(() => {
    authService.logout();
  }, 300);
});
