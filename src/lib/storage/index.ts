/**
 * Storage Module Barrel Export - Milestone 6-8
 *
 * Exports all storage-related functionality for the HTML Mockup
 * to React Converter application.
 */

// Main classes
export { SettingsStore, getSettingsStore, resetSettingsStore } from './settingsStore';
export { StorageManager, getStorageManager, resetStorageManager } from './storageManager';

// Type exports are handled by the types directory
export type {
  AppSettings,
  FormattingSettings,
  CssSettings,
  ComponentSettings,
  AdvancedSettings,
  UISettings,
  SettingsValidationResult,
  MigrationStep,
  StorageQuotaInfo,
  StorageOperationResult,
  SettingsExport,
  StorageItem,
  PartialSettings,
  SettingsCategory,
  SettingsUpdateOptions,
} from '@/types/storage.types';

export {
  StorageKeys,
  StorageKeyPrefix,
  StorageErrorCode,
  SETTINGS_SCHEMA_VERSION,
  DEFAULT_FORMATTING_SETTINGS,
  DEFAULT_CSS_SETTINGS,
  DEFAULT_COMPONENT_SETTINGS,
  DEFAULT_ADVANCED_SETTINGS,
  DEFAULT_UI_SETTINGS,
  DEFAULT_SETTINGS,
} from '@/types/storage.types';
