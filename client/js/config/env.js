const getBaseUrl = () => {
  if (typeof window === "undefined") {
    return "/api";
  }

  if (
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000/api";
  }

  return `${window.location.origin}/api`;
};

const ENV = {
  BASE_URL: getBaseUrl(),
};

export default ENV;
