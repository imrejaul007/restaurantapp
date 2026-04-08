import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const RESOURCE_KEY = 'resource';

export interface Permission {
  action: string; // 'create', 'read', 'update', 'delete', 'manage'
  resource: string; // 'user', 'restaurant', 'order', 'menu', etc.
  conditions?: any; // Additional conditions for fine-grained access
}

// Role-based authorization decorator
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Permission-based authorization decorator
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Resource-specific authorization decorator
export const RequireResource = (resource: string) => SetMetadata(RESOURCE_KEY, resource);

// Combined decorators for common use cases
export const AdminOnly = () => Roles(UserRole.ADMIN);

export const RestaurantAccess = () => Roles(UserRole.ADMIN, UserRole.RESTAURANT);

export const VendorAccess = () => Roles(UserRole.ADMIN, UserRole.VENDOR);

export const EmployeeAccess = () => Roles(UserRole.ADMIN, UserRole.RESTAURANT, UserRole.EMPLOYEE);

export const OwnerOnly = () => RequirePermissions({ action: 'manage', resource: 'self', conditions: { onlyOwner: true } });

// Resource-specific permission decorators
export const CanManageRestaurant = () => RequirePermissions({ action: 'manage', resource: 'restaurant' });

export const CanReadRestaurant = () => RequirePermissions({ action: 'read', resource: 'restaurant' });

export const CanManageOrders = () => RequirePermissions({ action: 'manage', resource: 'order' });

export const CanReadOrders = () => RequirePermissions({ action: 'read', resource: 'order' });

export const CanManageProducts = () => RequirePermissions({ action: 'manage', resource: 'product' });

export const CanReadProducts = () => RequirePermissions({ action: 'read', resource: 'product' });

export const CanManageEmployees = () => RequirePermissions({ action: 'manage', resource: 'employee' });

export const CanReadEmployees = () => RequirePermissions({ action: 'read', resource: 'employee' });

export const CanManageCustomers = () => RequirePermissions({ action: 'manage', resource: 'customer' });

export const CanReadCustomers = () => RequirePermissions({ action: 'read', resource: 'customer' });

export const CanManageMenu = () => RequirePermissions({ action: 'manage', resource: 'menu' });

export const CanReadMenu = () => RequirePermissions({ action: 'read', resource: 'menu' });

export const CanViewAnalytics = () => RequirePermissions({ action: 'read', resource: 'analytics' });

export const CanManageAnalytics = () => RequirePermissions({ action: 'manage', resource: 'analytics' });

// Time-based access decorators
export const BusinessHoursOnly = (startHour: number = 9, endHour: number = 17) =>
  RequirePermissions({
    action: 'access',
    resource: 'time-restricted',
    conditions: { timeRestriction: { startHour, endHour } }
  });

// Data isolation decorators
export const RequireOwnership = (resource: string) =>
  SetMetadata(RESOURCE_KEY, resource);

// Audit decorators
export const AuditableAction = (action: string) => SetMetadata('audit_action', action);

export const SensitiveOperation = () => SetMetadata('sensitive_operation', true);

// Rate limiting decorators
export const RateLimit = (limit: number, windowMs: number) =>
  SetMetadata('rate_limit', { limit, windowMs });

// IP restriction decorators
export const RequireInternalIP = () => SetMetadata('require_internal_ip', true);

export const BlockSuspiciousIPs = () => SetMetadata('block_suspicious_ips', true);

// Multi-factor authentication requirement
export const RequireMFA = () => SetMetadata('require_mfa', true);

export const RequireMFAForRole = (...roles: UserRole[]) =>
  SetMetadata('require_mfa_roles', roles);

// Data classification decorators
export const ClassifyData = (classification: 'public' | 'internal' | 'confidential' | 'restricted') =>
  SetMetadata('data_classification', classification);

// GDPR compliance decorators
export const RequireConsent = (purpose: string) =>
  SetMetadata('require_consent', purpose);

export const PersonalDataAccess = () => SetMetadata('personal_data_access', true);

// Security monitoring decorators
export const MonitorAccess = () => SetMetadata('monitor_access', true);

export const AlertOnAccess = (severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') =>
  SetMetadata('alert_on_access', severity);

// Session management decorators
export const RequireActiveSession = () => SetMetadata('require_active_session', true);

export const LimitConcurrentSessions = (maxSessions: number = 5) =>
  SetMetadata('max_concurrent_sessions', maxSessions);

// Environment-specific decorators
export const ProductionOnly = () => SetMetadata('production_only', true);

export const DevelopmentOnly = () => SetMetadata('development_only', true);

// Feature flag decorators
export const RequireFeatureFlag = (flagName: string) =>
  SetMetadata('require_feature_flag', flagName);

// Maintenance mode decorators
export const AllowDuringMaintenance = () => SetMetadata('allow_during_maintenance', true);

// API versioning decorators
export const RequireAPIVersion = (version: string) =>
  SetMetadata('require_api_version', version);

// Content type restrictions
export const RequireContentType = (contentType: string) =>
  SetMetadata('require_content_type', contentType);

// Request size limitations
export const LimitRequestSize = (maxSizeInBytes: number) =>
  SetMetadata('max_request_size', maxSizeInBytes);

// Cross-tenant data isolation
export const RequireTenantIsolation = () => SetMetadata('require_tenant_isolation', true);

// Encryption requirements
export const RequireEncryption = () => SetMetadata('require_encryption', true);

export const RequireEndToEndEncryption = () => SetMetadata('require_e2e_encryption', true);

// Compliance framework decorators
export const SOC2Compliant = () => SetMetadata('soc2_compliant', true);

export const PCI_DSS_Compliant = () => SetMetadata('pci_dss_compliant', true);

export const HIPAA_Compliant = () => SetMetadata('hipaa_compliant', true);

export const GDPR_Compliant = () => SetMetadata('gdpr_compliant', true);

// Emergency access decorators
export const EmergencyAccess = () => SetMetadata('emergency_access', true);

export const BreakGlassAccess = () => SetMetadata('break_glass_access', true);

// Delegation decorators
export const AllowDelegation = () => SetMetadata('allow_delegation', true);

export const RequireApproval = (approverRole: UserRole) =>
  SetMetadata('require_approval', approverRole);

// Context-aware security
export const RequireSecureContext = () => SetMetadata('require_secure_context', true);

export const RequireHTTPS = () => SetMetadata('require_https', true);

// Geographic restrictions
export const RequireLocation = (allowedCountries: string[]) =>
  SetMetadata('allowed_countries', allowedCountries);

// Device restrictions
export const RequireTrustedDevice = () => SetMetadata('require_trusted_device', true);

export const BlockMobileAccess = () => SetMetadata('block_mobile_access', true);

// Password policy enforcement
export const RequirePasswordChange = () => SetMetadata('require_password_change', true);

export const RequireStrongPassword = () => SetMetadata('require_strong_password', true);

// Session security
export const RequireSessionRevalidation = () => SetMetadata('require_session_revalidation', true);

export const NoRememberMe = () => SetMetadata('no_remember_me', true);

// Anti-automation
export const RequireCaptcha = () => SetMetadata('require_captcha', true);

export const BlockBots = () => SetMetadata('block_bots', true);

// Custom security policies
export const ApplySecurityPolicy = (policyName: string) =>
  SetMetadata('security_policy', policyName);

export const OverrideSecurityPolicy = (policyName: string, overrides: any) =>
  SetMetadata('security_policy_override', { policyName, overrides });

/**
 * Composite decorator for common restaurant management operations
 */
export const RestaurantManagement = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Roles(UserRole.ADMIN, UserRole.RESTAURANT)(target, propertyKey, descriptor);
    RequireResource('restaurant')(target, propertyKey, descriptor);
    AuditableAction('restaurant_management')(target, propertyKey, descriptor);
    MonitorAccess()(target, propertyKey, descriptor);
  };
};

/**
 * Composite decorator for sensitive financial operations
 */
export const FinancialOperation = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    RequireMFA()(target, propertyKey, descriptor);
    SensitiveOperation()(target, propertyKey, descriptor);
    AuditableAction('financial_operation')(target, propertyKey, descriptor);
    AlertOnAccess('high')(target, propertyKey, descriptor);
    RequireActiveSession()(target, propertyKey, descriptor);
    ClassifyData('confidential')(target, propertyKey, descriptor);
  };
};

/**
 * Composite decorator for administrative operations
 */
export const AdministrativeOperation = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    AdminOnly()(target, propertyKey, descriptor);
    RequireMFA()(target, propertyKey, descriptor);
    AuditableAction('admin_operation')(target, propertyKey, descriptor);
    AlertOnAccess('critical')(target, propertyKey, descriptor);
    RequireActiveSession()(target, propertyKey, descriptor);
  };
};

/**
 * Composite decorator for data export operations (GDPR compliance)
 */
export const DataExportOperation = () => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    RequireConsent('data_export')(target, propertyKey, descriptor);
    PersonalDataAccess()(target, propertyKey, descriptor);
    GDPR_Compliant()(target, propertyKey, descriptor);
    AuditableAction('data_export')(target, propertyKey, descriptor);
    RateLimit(5, 60 * 60 * 1000)(target, propertyKey, descriptor); // 5 requests per hour
  };
};