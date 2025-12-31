import React, { useState, useEffect } from 'react';
import { IconEye, IconEyeOff, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import {
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthPercentage,
  DEFAULT_PASSWORD_REQUIREMENTS,
  PasswordRequirements,
  PasswordValidationResult,
} from '@/utils/passwordValidator';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showStrengthMeter?: boolean;
  showRequirements?: boolean;
  requirements?: PasswordRequirements;
  userInputs?: string[]; // For zxcvbn context (username, email, etc.)
  onValidationChange?: (result: PasswordValidationResult) => void;
  error?: string;
}

function getStrengthColorClass(strength?: number): string {
  switch (strength) {
    case 0: return 'bg-red-500';
    case 1: return 'bg-orange-500';
    case 2: return 'bg-yellow-500';
    case 3: return 'bg-lime-500';
    case 4: return 'bg-green-500';
    default: return 'bg-gray-400';
  }
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label = 'Password',
      showStrengthMeter = true,
      showRequirements = true,
      requirements = DEFAULT_PASSWORD_REQUIREMENTS,
      userInputs = [],
      onValidationChange,
      error,
      className = '',
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [validationResult, setValidationResult] = useState<PasswordValidationResult | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [localValue, setLocalValue] = useState('');

    // Use controlled or uncontrolled approach
    const currentValue = (value ?? localValue) as string;

    useEffect(() => {
      if (currentValue) {
        const result = validatePassword(currentValue, requirements, userInputs);
        setValidationResult(result);
        if (onValidationChange) {
          onValidationChange(result);
        }
      } else {
        setValidationResult(null);
      }
    }, [currentValue, requirements, userInputs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      if (onChange) {
        onChange(e);
      }
    };

    const strengthColor = validationResult
      ? getPasswordStrengthColor(validationResult.strength)
      : 'text-gray-400';

    const strengthPercentage = validationResult
      ? getPasswordStrengthPercentage(validationResult.strength)
      : 0;

    return (
      <div className="w-full mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={currentValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full px-4 py-2 pr-12
              border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-orbit
              dark:bg-gray-800 dark:border-gray-700 dark:text-white
              ${error || (validationResult && !validationResult.isValid && currentValue) ? 'border-red-500' : 'border-gray-300'}
              ${className}
            `}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            tabIndex={-1}
          >
            {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
          </button>
        </div>

        {/* Strength Meter */}
        {showStrengthMeter && currentValue && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Password Strength:
              </span>
              <span className={`text-xs font-semibold ${strengthColor}`}>
                {validationResult?.strengthLabel || 'Unknown'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  getStrengthColorClass(validationResult?.strength)
                }`}
                style={{ width: `${strengthPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-2 flex items-start gap-2 text-red-600 dark:text-red-400">
            <IconX size={16} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* Requirements List */}
        {showRequirements && (isFocused || currentValue) && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password Requirements:
            </p>
            <ul className="space-y-1">
              <RequirementItem
                met={currentValue.length >= requirements.minLength}
                text={`At least ${requirements.minLength} characters`}
              />
              {requirements.requireUppercase && (
                <RequirementItem
                  met={/[A-Z]/.test(currentValue)}
                  text="One uppercase letter (A-Z)"
                />
              )}
              {requirements.requireLowercase && (
                <RequirementItem
                  met={/[a-z]/.test(currentValue)}
                  text="One lowercase letter (a-z)"
                />
              )}
              {requirements.requireNumbers && (
                <RequirementItem
                  met={/\d/.test(currentValue)}
                  text="One number (0-9)"
                />
              )}
              {requirements.requireSpecialChars && (
                <RequirementItem
                  met={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(currentValue)}
                  text="One special character (!@#$...)"
                />
              )}
              {requirements.forbidCommonPasswords && (
                <RequirementItem
                  met={validationResult ? validationResult.strength >= requirements.minStrengthScore : false}
                  text="Not a common or easily guessable password"
                />
              )}
            </ul>

            {/* Warnings and Suggestions */}
            {validationResult?.warning && (
              <div className="mt-2 flex items-start gap-2 text-orange-600 dark:text-orange-400">
                <IconAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs">{validationResult.warning}</p>
              </div>
            )}

            {validationResult?.suggestions && validationResult.suggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Suggestions:
                </p>
                <ul className="space-y-1">
                  {validationResult.suggestions.map((suggestion) => (
                    <li key={suggestion} className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => (
  <li className="flex items-center gap-2 text-xs">
    {met ? (
      <IconCheck size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
    ) : (
      <IconX size={14} className="text-gray-400 dark:text-gray-600 flex-shrink-0" />
    )}
    <span className={met ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
      {text}
    </span>
  </li>
);

export default PasswordInput;
