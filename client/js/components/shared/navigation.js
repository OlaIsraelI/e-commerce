const navigationState =
  window.__ultravegNavigationState ??
  (window.__ultravegNavigationState = {
    initializedBars: new WeakSet(),
  });

function syncBodyScroll(navigationBar) {
  if (window.innerWidth <= 760 && navigationBar.classList.contains("menu-open")) {
    document.body.style.overflow = "hidden";
    return;
  }

  document.body.style.overflow = "";
}

function setMenuState(navigationBar, navToggle, navIcon, isOpen) {
  navigationBar.classList.toggle("menu-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");

  if (navIcon) {
    navIcon.className = isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  }

  syncBodyScroll(navigationBar);
}

export function initNavigationMenu(root = document) {
  const navigationBars = root.querySelectorAll(".navigation-bar");

  navigationBars.forEach((navigationBar) => {
    if (navigationState.initializedBars.has(navigationBar)) {
      return;
    }

    const navToggle = navigationBar.querySelector(".nav-toggle");
    if (!navToggle) {
      return;
    }

    const navIcon = navToggle.querySelector("i");
    const navLinks = navigationBar.querySelectorAll(
      ".nav-links a, .nav-actions a",
    );

    navigationState.initializedBars.add(navigationBar);
    setMenuState(navigationBar, navToggle, navIcon, false);

    navToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMenuState(
        navigationBar,
        navToggle,
        navIcon,
        !navigationBar.classList.contains("menu-open"),
      );
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 760) {
          setMenuState(navigationBar, navToggle, navIcon, false);
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (
        navigationBar.classList.contains("menu-open") &&
        !navigationBar.contains(event.target)
      ) {
        setMenuState(navigationBar, navToggle, navIcon, false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        setMenuState(navigationBar, navToggle, navIcon, false);
      } else {
        syncBodyScroll(navigationBar);
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initNavigationMenu());
} else {
  initNavigationMenu();
}
