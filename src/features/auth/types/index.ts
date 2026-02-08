/**
 * Extended types for NextAuth v5
 */
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string | null;
    organizationName: string | null;
  }

  interface Session {
    user: User;
  }
}

/**
 * User credentials for login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * User registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  createOrganization?: boolean;
  organizationName?: string;
  organizationInn?: string;
}

/**
 * Auth action result
 */
export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * Password validation result
 */
export interface PasswordValidation {
  isValid: boolean;
  strength: PasswordStrength;
  score: number;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}
