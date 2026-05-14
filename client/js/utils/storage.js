const KEYS = {
  TOKEN: "auth_token",
};

export const setToken = (token) => localStorage.setItem(KEYS.TOKEN, token);

export const getToken = () => localStorage.getItem(KEYS.TOKEN);

export const clearToken = () => localStorage.removeItem(KEYS.TOKEN);
