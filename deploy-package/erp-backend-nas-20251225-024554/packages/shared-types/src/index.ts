// Re-export all types
export * from './api';
export * from './tenant';
export * from './license';
export * from './entities';
export * from './einvoice';
export * from './currency';
export * from './capability';
export * from './auth-policy';
export * from './branding';

// Re-export auth types (excluding Permission to avoid conflict with permissions.ts)
export {
  type TokenPayload,
  type RefreshTokenPayload,
  type LoginRequest,
  type LoginResponse,
  type AuthUser,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
  type PasswordResetRequest,
  type PasswordResetConfirmRequest,
  type ChangePasswordRequest,
  type RegisterRequest,
  type RegisterResponse,
  type SessionInfo,
  // Legacy permission system from auth.ts
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_MODULES,
  ALL_PERMISSION_CODES,
  hasPermission,
  getRolePermissions,
  // Export Permission type from auth.ts as LegacyPermission for backward compatibility
  type Permission as LegacyPermission,
} from './auth';

// Re-export new permissions system
export {
  Actions,
  Resources,
  Permissions,
  RolePermissions,
  isValidPermission,
  getPermissionsForRole,
  type Permission,
} from './permissions';

