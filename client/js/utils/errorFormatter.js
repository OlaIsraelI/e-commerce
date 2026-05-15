/**
 * Error Handling and Formatting Utility
 * Converts technical errors to user-friendly messages
 */

const ERROR_MESSAGES = {
  // Network errors
  "Failed to fetch": "Network error. Check your connection and try again.",
  NetworkError: "Connection lost. Please check your internet connection.",

  // Authentication errors
  "Invalid credentials": "Email or password is incorrect.",
  "User not found": "No account found with this email address.",
  "Please verify your account before logging in":
    "Please verify your email before logging in. Check your inbox for the verification code.",
  "Session expired": "Your session has expired. Please login again.",
  Unauthorized: "You are not authorized to perform this action.",
  "Not authorized": "Please login to access this resource.",

  // Rate limiting (429 status)
  "Too many login attempts":
    "Too many failed login attempts. Try again in 30 minutes or reset your password.",
  "Too many OTP attempts":
    "Too many verification attempts. Try again in 15 minutes.",
  "Too many password reset attempts":
    "Too many password reset requests. Try again later.",
  "Too many accounts created":
    "Too many accounts created from this IP. Try again later.",

  // Validation errors
  "Valid email required": "Please enter a valid email address.",
  "Valid Nigerian phone number required":
    "Please enter a valid Nigerian phone number.",
  "Password must be":
    "Password is too weak. Use uppercase, lowercase, numbers, and 8+ characters.",
  "OTP must be 6 digits": "OTP must be exactly 6 digits.",
  "At least one profile field is required": "Please update at least one field.",

  // Email and OTP errors
  "Invalid or expired OTP":
    "The verification code is invalid or has expired. Request a new one.",
  "Invalid or expired reset token":
    "The reset link has expired. Request a new one.",
  "Invalid or missing token":
    "The reset link is invalid or has expired. Request a new password reset.",
  "Email is required": "Please enter your email address.",
  "Password is required": "Please enter your password.",
  "All fields are required": "Please fill in all required fields.",

  // Account errors
  "User already exists":
    "An account with this email already exists. Try logging in.",
  "Account already verified": "This account is already verified.",

  // Server errors
  "Internal server error":
    "Something went wrong on our end. Please try again later.",
  "Service unavailable":
    "The service is temporarily unavailable. Please try again later.",

  // CSRF errors
  "CSRF token": "Security error. Please refresh the page and try again.",
};

/**
 * Format error response to user-friendly message
 * Handles different error types and HTTP status codes
 */
export const formatErrorMessage = (error, statusCode = null) => {
  // Handle null/undefined
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  // Handle string errors
  if (typeof error === "string") {
    // Check for exact matches first
    if (ERROR_MESSAGES[error]) {
      return ERROR_MESSAGES[error];
    }

    // Check for partial matches
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return message;
      }
    }

    // Return original if no match found
    return error.length > 0
      ? error
      : "An unexpected error occurred. Please try again.";
  }

  // Handle Error objects
  if (error instanceof Error) {
    return formatErrorMessage(error.message, statusCode);
  }

  // Handle object errors with message property
  if (error && typeof error === "object" && error.message) {
    return formatErrorMessage(error.message, statusCode);
  }

  // Handle JSON response objects
  if (error && typeof error === "object" && error.error) {
    return formatErrorMessage(error.error, statusCode);
  }

  // Handle status code based errors
  if (statusCode) {
    return getErrorByStatusCode(statusCode);
  }

  return "An unexpected error occurred. Please try again.";
};

/**
 * Get error message by HTTP status code
 */
const getErrorByStatusCode = (statusCode) => {
  const statusErrors = {
    400: "Invalid request. Please check your input and try again.",
    401: "Your session has expired. Please login again.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Server error. Please try again later.",
    502: "Gateway error. Please try again later.",
    503: "Service temporarily unavailable. Please try again later.",
    504: "Request timeout. Please try again.",
  };

  return statusErrors[statusCode] || "An error occurred. Please try again.";
};

/**
 * Check if error is rate limit related
 */
export const isRateLimitError = (error) => {
  const rateLimitKeywords = [
    "too many",
    "rate limit",
    "429",
    "slow down",
    "try again later",
  ];

  const errorText = typeof error === "string" ? error : error?.message || "";
  return rateLimitKeywords.some((keyword) =>
    errorText.toLowerCase().includes(keyword),
  );
};

/**
 * Check if error is authentication related
 */
export const isAuthError = (error) => {
  const authKeywords = [
    "unauthorized",
    "invalid credentials",
    "session expired",
    "not authenticated",
    "not authorized",
    "login",
  ];

  const errorText = typeof error === "string" ? error : error?.message || "";
  return authKeywords.some((keyword) =>
    errorText.toLowerCase().includes(keyword),
  );
};

/**
 * Check if error is validation related
 */
export const isValidationError = (error) => {
  const validationKeywords = [
    "required",
    "valid",
    "must be",
    "invalid format",
    "at least",
  ];

  const errorText = typeof error === "string" ? error : error?.message || "";
  return validationKeywords.some((keyword) =>
    errorText.toLowerCase().includes(keyword),
  );
};

/**
 * Extract error message from fetch response
 */
export const extractErrorMessage = async (response) => {
  try {
    const data = await response.json().catch(() => null);
    return (
      data?.message ||
      data?.error ||
      data?.errors?.[0] ||
      formatErrorMessage(
        `Error ${response.status}: ${response.statusText}`,
        response.status,
      )
    );
  } catch (error) {
    return formatErrorMessage(
      `Error ${response.status}: ${response.statusText}`,
      response.status,
    );
  }
};

export const ErrorTypes = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTH: "auth",
  RATE_LIMIT: "rate_limit",
  SERVER: "server",
  UNKNOWN: "unknown",
};

/**
 * Classify error type
 */
export const classifyError = (error) => {
  const errorText = typeof error === "string" ? error : error?.message || "";

  if (isRateLimitError(error)) return ErrorTypes.RATE_LIMIT;
  if (isAuthError(error)) return ErrorTypes.AUTH;
  if (isValidationError(error)) return ErrorTypes.VALIDATION;
  if (errorText.includes("Network") || errorText.includes("fetch")) {
    return ErrorTypes.NETWORK;
  }
  if (errorText.includes("500") || errorText.includes("502")) {
    return ErrorTypes.SERVER;
  }

  return ErrorTypes.UNKNOWN;
};
