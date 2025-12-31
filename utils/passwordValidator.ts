      import zxcvbn from 'zxcvbn';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: number; // 0-4 scale from zxcvbn
  strengthLabel: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  suggestions: string[];
  warning?: string;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minStrengthScore: number; // 0-4, recommended: 2 or 3
  forbidCommonPasswords: boolean;
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minStrengthScore: 2, // Fair or better
  forbidCommonPasswords: true,
};

const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /\d/;

/**
 * Validates password against configured requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS,
  userInputs: string[] = [] // Additional context like username, email for better analysis
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  // Check for uppercase letters
  if (requirements.requireUppercase && !UPPERCASE_REGEX.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  // Check for lowercase letters
  if (requirements.requireLowercase && !LOWERCASE_REGEX.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  // Check for numbers
  if (requirements.requireNumbers && !NUMBER_REGEX.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  // Check for special characters
  if (requirements.requireSpecialChars && !SPECIAL_CHARS_REGEX.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Use zxcvbn for advanced strength analysis
  const strengthResult = zxcvbn(password, userInputs);
  const strength = strengthResult.score; // 0-4

  // Check minimum strength score
  if (requirements.forbidCommonPasswords && strength < requirements.minStrengthScore) {
    errors.push(
      `Password is too weak. ${strengthResult.feedback.warning || 'Choose a stronger password'}`
    );
  }

  // Add suggestions from zxcvbn
  if (strengthResult.feedback.suggestions.length > 0) {
    suggestions.push(...strengthResult.feedback.suggestions);
  }

  // Determine strength label
  const strengthLabels: Array<'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong'> = [
    'Very Weak',
    'Weak',
    'Fair',
    'Strong',
    'Very Strong',
  ];

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    strengthLabel: strengthLabels[strength],
    suggestions,
    warning: strengthResult.feedback.warning || undefined,
  };
}

/**
 * Get a human-readable description of password requirements
 */
export function getPasswordRequirementsText(
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string {
  const parts: string[] = [];

  parts.push(`at least ${requirements.minLength} characters`);

  const charRequirements: string[] = [];
  if (requirements.requireUppercase) charRequirements.push('uppercase letter');
  if (requirements.requireLowercase) charRequirements.push('lowercase letter');
  if (requirements.requireNumbers) charRequirements.push('number');
  if (requirements.requireSpecialChars) charRequirements.push('special character');

  if (charRequirements.length > 0) {
    parts.push(`one ${charRequirements.join(', one ')}`);
  }

  return `Password must contain ${parts.join(' and ')}.`;
}

/**
 * Get password strength color for UI display
 */
export function getPasswordStrengthColor(strength: number): string {
  switch (strength) {
    case 0:
      return 'text-red-600 dark:text-red-400';
    case 1:
      return 'text-orange-600 dark:text-orange-400';
    case 2:
      return 'text-yellow-600 dark:text-yellow-400';
    case 3:
      return 'text-lime-600 dark:text-lime-400';
    case 4:
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Get password strength progress percentage
 */
export function getPasswordStrengthPercentage(strength: number): number {
  return (strength / 4) * 100;
}
