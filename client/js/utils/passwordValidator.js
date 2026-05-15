/**
 * Password Strength Validation Utility
 * Validates passwords and provides strength feedback
 */

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional for better UX
};

const STRENGTH_LEVELS = {
  WEAK: "weak",
  FAIR: "fair",
  GOOD: "good",
  STRONG: "strong",
};

/**
 * Validate password against requirements
 * Returns object with validation status and feedback
 */
export const validatePassword = (password) => {
  const errors = [];
  const warnings = [];

  if (!password) {
    return {
      valid: false,
      strength: STRENGTH_LEVELS.WEAK,
      errors: ["Password is required"],
      warnings: [],
      score: 0,
    };
  }

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    );
  }

  // Check for lowercase
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check for uppercase
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check for number
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for special characters (warning, not error)
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[@$!%*?&]/.test(password)) {
    warnings.push("Consider adding special characters for better security");
  } else if (
    !PASSWORD_REQUIREMENTS.requireSpecial &&
    !/[@$!%*?&]/.test(password)
  ) {
    warnings.push("Adding special characters makes your password stronger");
  }

  // Calculate strength score
  let score = 0;

  // Length scoring
  if (password.length >= PASSWORD_REQUIREMENTS.minLength) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character diversity scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;

  // Determine strength level
  let strength = STRENGTH_LEVELS.WEAK;
  if (score >= 5) strength = STRENGTH_LEVELS.STRONG;
  else if (score >= 4) strength = STRENGTH_LEVELS.GOOD;
  else if (score >= 2) strength = STRENGTH_LEVELS.FAIR;

  return {
    valid: errors.length === 0,
    strength,
    errors,
    warnings,
    score: Math.min(score, 7), // Cap score at 7
    feedback: getPasswordFeedback(password),
  };
};

/**
 * Get specific feedback about password
 */
const getPasswordFeedback = (password) => {
  if (!password) return "Password strength unknown";

  const checks = {
    tooShort: password.length < PASSWORD_REQUIREMENTS.minLength,
    noNumbers: !/\d/.test(password),
    noLowercase: !/[a-z]/.test(password),
    noUppercase: !/[A-Z]/.test(password),
    noSpecial: !/[@$!%*?&]/.test(password),
    repeating: /(.)\1{2,}/.test(password), // Checks for 3+ repeating characters
    sequential:
      /012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(
        password,
      ),
  };

  // Get specific issue
  if (checks.tooShort)
    return `Add ${PASSWORD_REQUIREMENTS.minLength - password.length} more characters`;
  if (checks.noNumbers) return "Add at least one number";
  if (checks.noLowercase) return "Add at least one lowercase letter";
  if (checks.noUppercase) return "Add at least one uppercase letter";
  if (checks.repeating) return "Avoid repeating characters";
  if (checks.sequential) return "Avoid sequential characters";

  return "Password looks good!";
};

/**
 * Check if two passwords match
 */
export const doPasswordsMatch = (password1, password2) => {
  if (!password1 || !password2) {
    return {
      match: false,
      error: "Both passwords must be entered",
    };
  }

  return {
    match: password1 === password2,
    error: password1 !== password2 ? "Passwords do not match" : null,
  };
};

/**
 * Get strength percentage for visual display
 */
export const getStrengthPercentage = (strength) => {
  const percentages = {
    [STRENGTH_LEVELS.WEAK]: 25,
    [STRENGTH_LEVELS.FAIR]: 50,
    [STRENGTH_LEVELS.GOOD]: 75,
    [STRENGTH_LEVELS.STRONG]: 100,
  };

  return percentages[strength] || 0;
};

/**
 * Get strength color for visual display
 */
export const getStrengthColor = (strength) => {
  const colors = {
    [STRENGTH_LEVELS.WEAK]: "#dc3545", // Red
    [STRENGTH_LEVELS.FAIR]: "#ffc107", // Yellow
    [STRENGTH_LEVELS.GOOD]: "#17a2b8", // Blue
    [STRENGTH_LEVELS.STRONG]: "#28a745", // Green
  };

  return colors[strength] || "#6c757d"; // Gray
};

export { STRENGTH_LEVELS, PASSWORD_REQUIREMENTS };
