/**
 * Settings Store - Milestone 6-8
 *
 * Type-safe localStorage wrapper with comprehensive error handling,
 * validation, and migration support for application settings.
 */

import type {
  AppSettings,
  StorageItem,
  StorageOperationResult,
  PartialSettings,
  SettingsExport,
} from '@/types/storage.types';
import {
  StorageKeys,
  DEFAULT_SETTINGS,
  SETTINGS_SCHEMA_VERSION,
  StorageErrorCode,
} from '@/types/storage.types';

/**
 * Application version
 */
export const APP_VERSION = '0.1.0';

/**
 * Safe JSON parse with fallback
 */
function safeJSONParse<T>(value: string | null, fallback: T): T {
  if (value === null) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringify with circular reference protection
 */
function safeJSONStringify(value: unknown): string | null {
  try {
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }
      return val;
    });
  } catch {
    return null;
  }
}

/**
 * Create a checksum string for data integrity validation
 */
function createChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Main Settings Store class
 *
 * Provides type-safe localStorage operations with automatic migration,
 * error handling, and data validation.
 */
export class SettingsStore {
  private storageAvailable: boolean;
  private storage: Storage;
  private cache: Map<string, StorageItem<unknown>>;

  /**
   * Creates a new SettingsStore instance
   *
   * @param storage - Storage implementation (defaults to localStorage)
   */
  constructor(storage: Storage = globalThis.localStorage) {
    this.storage = storage;
    this.cache = new Map();
    this.storageAvailable = this.checkStorageAvailability();
  }

  /**
   * Checks if localStorage is available and functional
   */
  private checkStorageAvailability(): boolean {
    try {
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Determines if storage is available
   */
  public isAvailable(): boolean {
    return this.storageAvailable;
  }

  /**
   * Gets the storage error code from an exception
   */
  private getStorageErrorCode(error: unknown): StorageErrorCode {
    if (error instanceof DOMException) {
      // Quota exceeded error
      if (
        error.code === 22 ||
        error.code === 1014 ||
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      ) {
        return StorageErrorCode.QUOTA_EXCEEDED;
      }
      // Access denied
      if (
        error.code === 18 ||
        error.name === 'SecurityError'
      ) {
        return StorageErrorCode.ACCESS_DENIED;
      }
    }
    return StorageErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Retrieves a raw storage item with type safety
   *
   * @param key - Storage key to retrieve
   * @returns Storage operation result
   */
  public getItem<T>(key: StorageKeys): StorageOperationResult<T> {
    if (!this.storageAvailable) {
      return {
        success: false,
        error: 'Storage is not available',
        errorCode: StorageErrorCode.STORAGE_DISABLED,
      };
    }

    try {
      const rawValue = this.storage.getItem(key);
      const parsed = rawValue !== null ? safeJSONParse<StorageItem<T>>(rawValue, null as any) : null;

      if (parsed === null) {
        return {
          success: false,
          error: 'Item not found or invalid format',
          errorCode: StorageErrorCode.INVALID_DATA,
        };
      }

      // Validate checksum if present
      if (parsed.checksum) {
        const dataString = safeJSONStringify(parsed.value);
        if (dataString && createChecksum(dataString) !== parsed.checksum) {
          return {
            success: false,
            error: 'Data integrity check failed',
            errorCode: StorageErrorCode.INVALID_DATA,
          };
        }
      }

      return {
        success: true,
        data: parsed.value,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: this.getStorageErrorCode(error),
      };
    }
  }

  /**
   * Stores a value with type safety and optional checksum
   *
   * @param key - Storage key to set
   * @param value - Value to store
   * @param includeChecksum - Whether to include data integrity checksum
   * @returns Storage operation result
   */
  public setItem<T>(key: StorageKeys, value: T, includeChecksum = true): StorageOperationResult<void> {
    if (!this.storageAvailable) {
      return {
        success: false,
        error: 'Storage is not available',
        errorCode: StorageErrorCode.STORAGE_DISABLED,
      };
    }

    try {
      const dataString = safeJSONStringify(value);
      if (dataString === null) {
        return {
          success: false,
          error: 'Failed to serialize value',
          errorCode: StorageErrorCode.INVALID_DATA,
        };
      }

      const storageItem: StorageItem<T> = {
        value,
        version: SETTINGS_SCHEMA_VERSION,
        timestamp: Date.now(),
        checksum: includeChecksum ? createChecksum(dataString) : undefined,
      };

      this.storage.setItem(key, JSON.stringify(storageItem));
      this.cache.set(key, storageItem);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: this.getStorageErrorCode(error),
      };
    }
  }

  /**
   * Removes an item from storage
   *
   * @param key - Storage key to remove
   * @returns Storage operation result
   */
  public removeItem(key: StorageKeys): StorageOperationResult<void> {
    if (!this.storageAvailable) {
      return {
        success: false,
        error: 'Storage is not available',
        errorCode: StorageErrorCode.STORAGE_DISABLED,
      };
    }

    try {
      this.storage.removeItem(key);
      this.cache.delete(key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: this.getStorageErrorCode(error),
      };
    }
  }

  /**
   * Clears all application data from storage
   *
   * @returns Storage operation result
   */
  public clear(): StorageOperationResult<void> {
    if (!this.storageAvailable) {
      return {
        success: false,
        error: 'Storage is not available',
        errorCode: StorageErrorCode.STORAGE_DISABLED,
      };
    }

    try {
      // Only remove keys that belong to our app
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith('mockto-')) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        this.storage.removeItem(key);
      }

      this.cache.clear();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: this.getStorageErrorCode(error),
      };
    }
  }

  /**
   * Loads application settings with default fallback
   *
   * @returns Application settings
   */
  public loadSettings(): AppSettings {
    if (!this.storageAvailable) {
      return { ...DEFAULT_SETTINGS };
    }

    const result = this.getItem<AppSettings>(StorageKeys.SETTINGS);

    if (!result.success || !result.data) {
      return { ...DEFAULT_SETTINGS };
    }

    // Ensure schema version exists
    const settings = result.data;
    if (typeof settings.schemaVersion !== 'number') {
      return { ...DEFAULT_SETTINGS };
    }

    return settings;
  }

  /**
   * Saves application settings
   *
   * @param settings - Settings to save
   * @returns Storage operation result
   */
  public saveSettings(settings: AppSettings): StorageOperationResult<void> {
    const settingsToSave: AppSettings = {
      ...settings,
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      lastUpdated: Date.now(),
    };

    return this.setItem(StorageKeys.SETTINGS, settingsToSave);
  }

  /**
   * Updates settings with partial data
   *
   * @param updates - Partial settings to update
   * @returns Storage operation result
   */
  public updateSettings(updates: PartialSettings): StorageOperationResult<void> {
    const currentSettings = this.loadSettings();
    const mergedSettings: AppSettings = {
      ...currentSettings,
      ...updates,
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      lastUpdated: Date.now(),
    };

    // Merge nested objects
    if (updates.component) {
      mergedSettings.component = { ...currentSettings.component, ...updates.component };
    }
    if (updates.css) {
      mergedSettings.css = { ...currentSettings.css, ...updates.css };
    }
    if (updates.formatting) {
      mergedSettings.formatting = { ...currentSettings.formatting, ...updates.formatting };
    }
    if (updates.advanced) {
      mergedSettings.advanced = { ...currentSettings.advanced, ...updates.advanced };
    }
    if (updates.ui) {
      mergedSettings.ui = { ...currentSettings.ui, ...updates.ui };
    }

    return this.saveSettings(mergedSettings);
  }

  /**
   * Resets settings to defaults
   *
   * @returns Storage operation result
   */
  public resetSettings(): StorageOperationResult<void> {
    return this.saveSettings({ ...DEFAULT_SETTINGS });
  }

  /**
   * Exports settings as JSON string
   *
   * @returns Export result
   */
  public exportSettings(): StorageOperationResult<string> {
    try {
      const settings = this.loadSettings();
      const exportData: SettingsExport = {
        settings,
        metadata: {
          exportedAt: Date.now(),
          appVersion: APP_VERSION,
          schemaVersion: SETTINGS_SCHEMA_VERSION,
          formatVersion: 1,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return {
        success: true,
        data: jsonString,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export settings',
      };
    }
  }

  /**
   * Imports settings from JSON string
   *
   * @param jsonString - JSON string to import
   * @returns Import result
   */
  public importSettings(jsonString: string): StorageOperationResult<void> {
    try {
      const importData = JSON.parse(jsonString) as SettingsExport;

      // Basic validation
      if (!importData.settings || !importData.metadata) {
        return {
          success: false,
          error: 'Invalid import format',
          errorCode: StorageErrorCode.INVALID_DATA,
        };
      }

      // Save imported settings
      const result = this.saveSettings(importData.settings);

      if (!result.success) {
        return result;
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import settings',
        errorCode: StorageErrorCode.INVALID_DATA,
      };
    }
  }

  /**
   * Gets the storage size for all application data
   *
   * @returns Size in bytes or null if unavailable
   */
  public getStorageSize(): number | null {
    if (!this.storageAvailable) {
      return null;
    }

    let totalSize = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith('mockto-')) {
        const value = this.storage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }

    return totalSize;
  }

  /**
   * Gets approximate storage quota information
   *
   * Note: This is an approximation as browser storage APIs
   * don't provide exact quota information
   *
   * @returns Quota information or null if unavailable
   */
  public getQuotaInfo(): { usage: number; estimatedQuota: number } | null {
    if (!this.storageAvailable) {
      return null;
    }

    const usage = this.getStorageSize() ?? 0;
    // Common localStorage limits: 5-10MB depending on browser
    const estimatedQuota = 5 * 1024 * 1024; // 5MB default

    return { usage, estimatedQuota };
  }
}

/**
 * Singleton instance of the settings store
 */
let settingsStoreInstance: SettingsStore | null = null;

/**
 * Gets the singleton settings store instance
 *
 * @returns SettingsStore instance
 */
export function getSettingsStore(): SettingsStore {
  if (!settingsStoreInstance) {
    settingsStoreInstance = new SettingsStore();
  }
  return settingsStoreInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetSettingsStore(): void {
  settingsStoreInstance = null;
}
