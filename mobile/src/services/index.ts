// External Services Integration
// Notifications, Health, Analytics, Crashlytics, etc.
export * from './notification';
export * from './health';
export * from './analytics';
export * from './crashlytics';

// Data Management
export { DataExportService } from './DataExportService';
export type { UserExportData, ExportFormat } from './DataExportService';
export { DataDeletionService } from './DataDeletionService';
export type { DeletionResult, DeletionOptions } from './DataDeletionService';
export { PrivacySettingsService } from './PrivacySettingsService';
export type { PrivacySettings, PrivacyPolicy } from './PrivacySettingsService';

// Performance & Battery
export { BatteryMonitor } from './BatteryMonitor';
export type { BatteryState } from './BatteryMonitor';
export { PowerSavingManager } from './PowerSavingManager';
export type { PowerSavingSettings, PowerSavingConfig } from './PowerSavingManager';
export { PerformanceMonitor } from './PerformanceMonitor';
export type { PerformanceMetrics } from './PerformanceMonitor';
export { ImageCache } from './ImageCache';
export type { CacheStats } from './ImageCache';

// Accessibility
export { AccessibilityService } from './AccessibilityService';
export type { AccessibilityState } from './AccessibilityService';
