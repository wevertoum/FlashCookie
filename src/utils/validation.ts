/**
 * Validation utilities
 */

/**
 * RF-001: Valid email validation
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * RF-001: Password validation (minimum characters to be defined)
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * RF-001: Validate password and password confirmation are equal
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

