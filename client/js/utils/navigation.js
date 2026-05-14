const isAuthPage = () => window.location.pathname.includes("/pages/auth/");

const resolveHref = (relativePath) =>
  new URL(relativePath, window.location.href).href;

export const getLoginPageHref = () =>
  resolveHref(isAuthPage() ? "./login.html" : "../auth/login.html");

export const getDashboardPageHref = () =>
  resolveHref(
    isAuthPage() ? "../dashboard/dashboard.html" : "./dashboard/dashboard.html",
  );

export const getVerifyAccountPageHref = (email) => {
  const url = new URL(
    isAuthPage() ? "./verify-account.html" : "../auth/verify-account.html",
    window.location.href,
  );

  if (email) {
    url.searchParams.set("email", String(email));
  }

  return url.href;
};
