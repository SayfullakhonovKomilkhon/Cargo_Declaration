'use client';

import { useMemo } from 'react';

import { cn } from '@/lib/utils';

import type { PasswordStrength as PasswordStrengthType, PasswordValidation } from '../types';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

/**
 * Validate password and calculate strength
 */
export function validatePassword(password: string): PasswordValidation {
  const checks = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = passedChecks;

  let strength: PasswordStrengthType;
  if (score <= 2) {
    strength = 'weak';
  } else if (score === 3) {
    strength = 'fair';
  } else if (score === 4) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  const isValid = Object.values(checks).every(Boolean);

  return {
    isValid,
    strength,
    score,
    checks,
  };
}

/**
 * Password strength indicator component
 */
export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const validation = useMemo(() => validatePassword(password), [password]);

  if (!password) {
    return null;
  }

  const strengthColors: Record<PasswordStrengthType, string> = {
    weak: 'bg-red-500',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels: Record<PasswordStrengthType, string> = {
    weak: 'Слабый',
    fair: 'Средний',
    good: 'Хороший',
    strong: 'Сильный',
  };

  const strengthTextColors: Record<PasswordStrengthType, string> = {
    weak: 'text-red-600',
    fair: 'text-orange-600',
    good: 'text-yellow-600',
    strong: 'text-green-600',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'h-full flex-1 rounded-full transition-colors',
                validation.score >= level ? strengthColors[validation.strength] : 'bg-gray-200'
              )}
            />
          ))}
        </div>
        <span className={cn('text-xs font-medium', strengthTextColors[validation.strength])}>
          {strengthLabels[validation.strength]}
        </span>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1 text-xs">
        <li
          className={cn(
            'flex items-center gap-1.5',
            validation.checks.minLength ? 'text-green-600' : 'text-gray-500'
          )}
        >
          {validation.checks.minLength ? '✓' : '○'} Минимум 12 символов
        </li>
        <li
          className={cn(
            'flex items-center gap-1.5',
            validation.checks.hasUppercase ? 'text-green-600' : 'text-gray-500'
          )}
        >
          {validation.checks.hasUppercase ? '✓' : '○'} Заглавная буква (A-Z)
        </li>
        <li
          className={cn(
            'flex items-center gap-1.5',
            validation.checks.hasLowercase ? 'text-green-600' : 'text-gray-500'
          )}
        >
          {validation.checks.hasLowercase ? '✓' : '○'} Строчная буква (a-z)
        </li>
        <li
          className={cn(
            'flex items-center gap-1.5',
            validation.checks.hasNumber ? 'text-green-600' : 'text-gray-500'
          )}
        >
          {validation.checks.hasNumber ? '✓' : '○'} Цифра (0-9)
        </li>
        <li
          className={cn(
            'flex items-center gap-1.5',
            validation.checks.hasSpecialChar ? 'text-green-600' : 'text-gray-500'
          )}
        >
          {validation.checks.hasSpecialChar ? '✓' : '○'} Специальный символ (!@#$%^&*)
        </li>
      </ul>
    </div>
  );
}
