import { authService } from "../../services/authService.js";
import { protectRoute } from "../../utils/guard.js";
import { showMessage } from "../../utils/ui.js";
import { getMe, updateMe } from "../../services/api/authApi.js";

await protectRoute();

const user = authService.getUser();

const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");

const summaryName = document.getElementById("summaryName");
const summaryEmail = document.getElementById("summaryEmail");
const avatarText = document.getElementById("avatarText");
const logoutBtn = document.getElementById("logoutBtn");

const renderUser = (profile) => {
  const name = profile?.name || "User";
  const email = profile?.email || "No email";
  const phone = profile?.phone || profile?.number || "";

  nameInput.value = name;
  emailInput.value = email;
  phoneInput.value = phone;

  summaryName.textContent = name;
  summaryEmail.textContent = email;
  avatarText.textContent = name.trim().charAt(0).toUpperCase() || "U";
};

renderUser(user);

const hydrateFromServer = async () => {
  try {
    const res = await getMe();
    const serverUser = res?.data;

    if (serverUser) {
      authService.updateUser(serverUser);
      renderUser(serverUser);
    }
  } catch (error) {
    showMessage(
      error.message || "Unable to load latest profile data.",
      "error",
    );
  }
};

hydrateFromServer();

profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
  };

  if (!payload.name || !payload.email) {
    showMessage("Name and email are required.", "error");
    return;
  }

  try {
    const res = await updateMe(payload);
    const updatedUser = res?.data || payload;
    const mergedUser = authService.updateUser(updatedUser);

    renderUser(mergedUser);
    showMessage("Profile updated successfully.", "success");
  } catch (error) {
    showMessage(error.message || "Failed to update profile.", "error");
  }
});

logoutBtn?.addEventListener("click", () => {
  authService.logout();
});
