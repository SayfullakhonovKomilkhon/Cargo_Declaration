// Components
export {
  LoginForm,
  RegisterForm,
  PasswordStrength,
  validatePassword,
  AuthGuard,
  withRole,
} from './components';

// Actions
export { login, register, logout, loginDirect } from './actions';

// Hooks
export {
  useAuth,
  useRequireAuth,
  usePermission,
  useAnyPermission,
  useRole,
} from './hooks';

// Permissions
export {
  Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissions,
  isRoleHigherOrEqual,
  getRoleDisplayName,
  getAllRoles,
} from './utils/permissions';

// Types
export type {
  LoginCredentials,
  RegisterData,
  AuthResult,
  PasswordStrength as PasswordStrengthType,
  PasswordValidation,
} from './types';
