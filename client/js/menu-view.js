import { initNavigationMenu } from "./components/shared/navigation.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initNavigationMenu());
} else {
  initNavigationMenu();
}
