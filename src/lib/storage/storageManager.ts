/**
 * Storage Manager - Milestone 6-8
 *
 * High-level storage management with quota handling, migration support,
 * and advanced features for the HTML Mockup to React Converter.
 */

import type {
  AppSettings,
  StorageQuotaInfo,
  MigrationStep,
  SettingsValidationResult,
  StorageOperationResult,
} from '@/types/storage.types';
import {
  StorageKeys,
  SETTINGS_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  StorageErrorCode,
} from '@/types/storage.types';
import { SettingsStore, getSettingsStore } from './settingsStore';

/**
 * Migration registry for handling settings version upgrades
 */
class MigrationRegistry {
  private migrations: Map<number, MigrationStep> = new Map();

  /**
   * Registers a migration step
   */
  public register(migration: MigrationStep): void {
    this.migrations.set(migration.fromVersion, migration);
  }

  /**
   * Gets a migration step for a version
   */
  public get(fromVersion: number): MigrationStep | undefined {
    return this.migrations.get(fromVersion);
  }

  /**
   * Gets all registered migration steps
   */
  public getAll(): MigrationStep[] {
    return Array.from(this.migrations.values()).sort((a, b) => a.fromVersion - b.fromVersion);
  }

  /**
   * Checks if a migration path exists
   */
  public canMigrate(fromVersion: number, toVersion: number): boolean {
    let currentVersion = fromVersion;
    const visited = new Set<number>();

    while (currentVersion < toVersion) {
      if (visited.has(currentVersion)) {
        return false; // Circular dependency
      }
      visited.add(currentVersion);

      const migration = this.get(currentVersion);
      if (!migration) {
        return false;
      }

      currentVersion = migration.toVersion;
    }

    return currentVersion === toVersion;
  }
}

/**
 * Settings validator
 */
class SettingsValidator {
  /**
   * Validates settings object
   */
  public validate(settings: unknown): SettingsValidationResult {
    const errors: string[] = [];
    const missing: string[] = [];
    const unknown: string[] = [];

    if (!settings || typeof settings !== 'object') {
      return {
        isValid: false,
        errors: ['Settings must be an object'],
        missing: [],
        unknown: [],
      };
    }

    const settingsObj = settings as Record<string, unknown>;

    // Check required fields
    const requiredFields: (keyof AppSettings)[] = [
      'schemaVersion',
      'component',
      'css',
      'formatting',
      'advanced',
      'ui',
      'lastUpdated',
    ];

    for (const field of requiredFields) {
      if (!(field in settingsObj)) {
        missing.push(field);
      }
    }

    // Validate schemaVersion
    if ('schemaVersion' in settingsObj) {
      if (typeof settingsObj.schemaVersion !== 'number') {
        errors.push('schemaVersion must be a number');
      }
    }

    // Validate component settings
    if ('component' in settingsObj && settingsObj.component) {
      const component = settingsObj.component as Record<string, unknown>;
      const requiredComponentFields = ['outputFormat', 'convertClassToClassName'];
      for (const field of requiredComponentFields) {
        if (!(field in component)) {
          errors.push(`component.${field} is required`);
        }
      }
    }

    // Validate CSS settings
    if ('css' in settingsObj && settingsObj.css) {
      const css = settingsObj.css as Record<string, unknown>;
      if ('strategy' in css && typeof css.strategy !== 'string') {
        errors.push('css.strategy must be a string');
      }
    }

    // Check for unknown fields (potential version mismatch)
    const knownFields = new Set([
      ...requiredFields,
      'appVersion',
    ]);
    const allKeys = Object.keys(settingsObj);
    for (const key of allKeys) {
      if (!knownFields.has(key)) {
        unknown.push(key);
      }
    }

    return {
      isValid: errors.length === 0 && missing.length === 0,
      errors,
      missing,
      unknown,
    };
  }

  /**
   * Sanitizes settings by removing invalid/unknown fields
   */
  public sanitize(settings: unknown): AppSettings {
    const validation = this.validate(settings);

    if (!validation.isValid) {
      // Return defaults if validation fails severely
      if (validation.missing.length > 0) {
        return { ...DEFAULT_SETTINGS };
      }
    }

    const settingsObj = settings as Partial<AppSettings>;
    const sanitized: AppSettings = {
      schemaVersion: typeof settingsObj.schemaVersion === 'number'
        ? settingsObj.schemaVersion
        : DEFAULT_SETTINGS.schemaVersion,
      component: {
        ...DEFAULT_SETTINGS.component,
        ...settingsObj.component,
      },
      css: {
        ...DEFAULT_SETTINGS.css,
        ...settingsObj.css,
      },
      formatting: {
        ...DEFAULT_SETTINGS.formatting,
        ...settingsObj.formatting,
      },
      advanced: {
        ...DEFAULT_SETTINGS.advanced,
        ...settingsObj.advanced,
      },
      ui: {
        ...DEFAULT_SETTINGS.ui,
        ...settingsObj.ui,
      },
      lastUpdated: typeof settingsObj.lastUpdated === 'number'
        ? settingsObj.lastUpdated
        : Date.now(),
      appVersion: settingsObj.appVersion,
    };

    return sanitized;
  }
}

/**
 * Storage Manager class
 *
 * Provides high-level storage operations with quota management,
 * migration support, and data validation.
 */
export class StorageManager {
  private store: SettingsStore;
  private migrationRegistry: MigrationRegistry;
  private validator: SettingsValidator;

  constructor(store?: SettingsStore) {
    this.store = store ?? getSettingsStore();
    this.migrationRegistry = new MigrationRegistry();
    this.validator = new SettingsValidator();
    this.registerDefaultMigrations();
  }

  /**
   * Registers default migration steps
   */
  private registerDefaultMigrations(): void {
    // Placeholder for future migrations
    // When schema version 2 is introduced, add:
    // this.migrationRegistry.register({
    //   fromVersion: 1,
    //   toVersion: 2,
    //   migrate: (settings) => this.migrateV1ToV2(settings),
    //   description: 'Add new theme support',
    // });
  }

  /**
   * Registers a custom migration step
   */
  public registerMigration(migration: MigrationStep): void {
    this.migrationRegistry.register(migration);
  }

  /**
   * Migrates settings from an older version
   */
  private migrateSettings(settings: unknown, targetVersion = SETTINGS_SCHEMA_VERSION): AppSettings {
    const validation = this.validator.validate(settings);

    if (!validation.isValid && validation.missing.includes('schemaVersion')) {
      // Very old settings without schema version, assume v0
      const partialSettings = typeof settings === 'object' && settings !== null ? settings as Partial<AppSettings> : {};
      return this.applyMigrations({ ...DEFAULT_SETTINGS, ...partialSettings }, 0, targetVersion);
    }

    const currentSettings = settings as AppSettings;
    return this.applyMigrations(currentSettings, currentSettings.schemaVersion, targetVersion);
  }

  /**
   * Applies migration steps
   */
  private applyMigrations(settings: AppSettings, fromVersion: number, toVersion: number): AppSettings {
    let currentSettings = { ...settings };
    let currentVersion = fromVersion;

    while (currentVersion < toVersion) {
      const migration = this.migrationRegistry.get(currentVersion);

      if (!migration) {
        // No migration path, use defaults for newer fields
        currentSettings = {
          ...DEFAULT_SETTINGS,
          ...currentSettings,
          schemaVersion: toVersion,
        };
        break;
      }

      currentSettings = migration.migrate(currentSettings);
      currentVersion = migration.toVersion;
    }

    return currentSettings;
  }

  /**
   * Loads and migrates settings if needed
   */
  public loadSettings(): AppSettings {
    const rawSettings = this.store.loadSettings();

    if (rawSettings.schemaVersion < SETTINGS_SCHEMA_VERSION) {
      return this.migrateSettings(rawSettings);
    }

    return rawSettings;
  }

  /**
   * Saves settings with validation
   */
  public saveSettings(settings: AppSettings): StorageOperationResult<void> {
    const validation = this.validator.validate(settings);

    if (!validation.isValid) {
      return {
        success: false,
        error: `Settings validation failed: ${validation.errors.join(', ')}`,
        errorCode: StorageErrorCode.INVALID_DATA,
      };
    }

    return this.store.saveSettings(settings);
  }

  /**
   * Updates settings with partial data and validation
   */
  public updateSettings(updates: Partial<AppSettings>): StorageOperationResult<void> {
    const currentSettings = this.loadSettings();
    const mergedSettings: AppSettings = {
      ...currentSettings,
      ...updates,
      lastUpdated: Date.now(),
    };

    return this.saveSettings(mergedSettings);
  }

  /**
   * Resets all settings to defaults
   */
  public resetToDefaults(): StorageOperationResult<void> {
    return this.store.resetSettings();
  }

  /**
   * Validates current settings
   */
  public validateSettings(): SettingsValidationResult {
    const settings = this.store.loadSettings();
    return this.validator.validate(settings);
  }

  /**
   * Gets storage quota information
   */
  public getQuotaInfo(): StorageQuotaInfo | null {
    const quotaInfo = this.store.getQuotaInfo();

    if (!quotaInfo) {
      return null;
    }

    const { usage, estimatedQuota } = quotaInfo;

    return {
      quota: estimatedQuota,
      usage,
      remaining: Math.max(0, estimatedQuota - usage),
      usagePercentage: (usage / estimatedQuota) * 100,
    };
  }

  /**
   * Checks if storage quota is critically low
   */
  public isQuotaCritical(thresholdPercentage = 90): boolean {
    const info = this.getQuotaInfo();
    return info ? info.usagePercentage >= thresholdPercentage : false;
  }

  /**
   * Clears old cache data to free up space
   */
  public clearCache(): StorageOperationResult<void> {
    return this.store.removeItem(StorageKeys.CONVERSION_CACHE);
  }

  /**
   * Clears conversion history
   */
  public clearHistory(): StorageOperationResult<void> {
    return this.store.removeItem(StorageKeys.CONVERSION_HISTORY);
  }

  /**
   * Clears all application data
   */
  public clearAll(): StorageOperationResult<void> {
    return this.store.clear();
  }

  /**
   * Exports settings with metadata
   */
  public exportSettings(): StorageOperationResult<string> {
    return this.store.exportSettings();
  }

  /**
   * Imports and migrates settings
   */
  public importSettings(jsonString: string): StorageOperationResult<void> {
    try {
      const importData = JSON.parse(jsonString) as {
        settings: unknown;
        metadata?: { schemaVersion?: number };
      };

      // Validate and migrate imported settings
      const migratedSettings = this.migrateSettings(
        importData.settings,
        importData.metadata?.schemaVersion ?? 1
      );

      return this.saveSettings(migratedSettings);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
        errorCode: StorageErrorCode.INVALID_DATA,
      };
    }
  }

  /**
   * Gets detailed storage statistics
   */
  public getStorageStats(): {
    totalSize: number;
    itemCount: number;
    quotaInfo: StorageQuotaInfo | null;
    breakdown: Record<string, number>;
  } | null {
    if (!this.store.isAvailable()) {
      return null;
    }

    const breakdown: Record<string, number> = {};
    let totalSize = 0;
    let itemCount = 0;

    const storage = this.store['storage'] as Storage;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('mockto-')) {
        const value = storage.getItem(key);
        if (value) {
          const size = key.length + value.length;
          breakdown[key] = size;
          totalSize += size;
          itemCount++;
        }
      }
    }

    return {
      totalSize,
      itemCount,
      quotaInfo: this.getQuotaInfo(),
      breakdown,
    };
  }

  /**
   * Creates a backup of all application data
   */
  public createBackup(): StorageOperationResult<string> {
    if (!this.store.isAvailable()) {
      return {
        success: false,
        error: 'Storage is not available',
        errorCode: StorageErrorCode.STORAGE_DISABLED,
      };
    }

    try {
      const backup: Record<string, unknown> = {
        settings: this.store.loadSettings(),
        version: SETTINGS_SCHEMA_VERSION,
        timestamp: Date.now(),
      };

      // Include cache if it exists
      const cacheResult = this.store.getItem(StorageKeys.CONVERSION_CACHE);
      if (cacheResult.success && cacheResult.data) {
        backup.cache = cacheResult.data;
      }

      // Include history if it exists
      const historyResult = this.store.getItem(StorageKeys.CONVERSION_HISTORY);
      if (historyResult.success && historyResult.data) {
        backup.history = historyResult.data;
      }

      return {
        success: true,
        data: JSON.stringify(backup, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup failed',
      };
    }
  }

  /**
   * Restores from a backup
   */
  public restoreFromBackup(backupString: string): StorageOperationResult<void> {
    try {
      const backup = JSON.parse(backupString) as {
        settings?: unknown;
        cache?: unknown;
        history?: unknown;
        version?: number;
      };

      // Restore settings with migration
      if (backup.settings) {
        const migratedSettings = this.migrateSettings(
          backup.settings,
          backup.version ?? 1
        );
        const saveResult = this.saveSettings(migratedSettings);
        if (!saveResult.success) {
          return saveResult;
        }
      }

      // Restore cache
      if (backup.cache !== undefined) {
        this.store.setItem(StorageKeys.CONVERSION_CACHE, backup.cache);
      }

      // Restore history
      if (backup.history !== undefined) {
        this.store.setItem(StorageKeys.CONVERSION_HISTORY, backup.history);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
        errorCode: StorageErrorCode.INVALID_DATA,
      };
    }
  }

  /**
   * Gets the underlying settings store
   */
  public getStore(): SettingsStore {
    return this.store;
  }
}

/**
 * Singleton instance of the storage manager
 */
let storageManagerInstance: StorageManager | null = null;

/**
 * Gets the singleton storage manager instance
 *
 * @returns StorageManager instance
 */
export function getStorageManager(): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager();
  }
  return storageManagerInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetStorageManager(): void {
  storageManagerInstance = null;
}
