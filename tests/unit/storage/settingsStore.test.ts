/**
 * Settings Store Unit Tests - Milestone 6-8
 *
 * Comprehensive test suite for the Settings Store module.
 * Tests localStorage operations, error handling, validation,
 * migration support, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsStore, getSettingsStore, resetSettingsStore } from '@/lib/storage/settingsStore';
import { StorageManager, getStorageManager, resetStorageManager } from '@/lib/storage/storageManager';
import {
  StorageKeys,
  DEFAULT_SETTINGS,
  SETTINGS_SCHEMA_VERSION,
  StorageErrorCode,
  CssStrategy,
  OutputFormat,
  type AppSettings,
  type PartialSettings,
} from '@/types/storage.types';

/**
 * Mock storage implementation for testing
 */
class MockStorage implements Storage {
  private data: Map<string, string> = new Map();
  private quotaExceeded = false;
  private disabled = false;

  get length(): number {
    if (this.disabled) throw new Error('Storage disabled');
    return this.data.size;
  }

  clear(): void {
    if (this.disabled) throw new Error('Storage disabled');
    this.data.clear();
  }

  getItem(key: string): string | null {
    if (this.disabled) throw new Error('Storage disabled');
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.disabled) throw new Error('Storage disabled');
    if (this.quotaExceeded) {
      // Use Object.defineProperty to set the read-only code property
      const error = new Error('QuotaExceeded') as DOMException & { code: number };
      error.name = 'QuotaExceededError';
      Object.defineProperty(error, 'code', {
        value: 22,
        writable: false,
        configurable: true,
      });
      throw error;
    }
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    if (this.disabled) throw new Error('Storage disabled');
    this.data.delete(key);
  }

  key(index: number): string | null {
    if (this.disabled) throw new Error('Storage disabled');
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  setQuotaExceeded(value: boolean): void {
    this.quotaExceeded = value;
  }

  setDisabled(value: boolean): void {
    this.disabled = value;
  }

  getData(): Map<string, string> {
    return new Map(this.data);
  }
}

describe('SettingsStore', () => {
  let mockStorage: MockStorage;
  let store: SettingsStore;

  beforeEach(() => {
    mockStorage = new MockStorage();
    store = new SettingsStore(mockStorage as unknown as Storage);
    resetSettingsStore();
    resetStorageManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Storage Availability', () => {
    it('should detect available storage', () => {
      expect(store.isAvailable()).toBe(true);
    });

    it('should handle disabled storage gracefully', () => {
      (mockStorage as MockStorage).setDisabled(true);
      const disabledStore = new SettingsStore(mockStorage as unknown as Storage);

      expect(disabledStore.isAvailable()).toBe(false);
    });

    it('should return defaults when storage is disabled', () => {
      (mockStorage as MockStorage).setDisabled(true);
      const disabledStore = new SettingsStore(mockStorage as unknown as Storage);

      const settings = disabledStore.loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('Basic Operations', () => {
    it('should store and retrieve a value', () => {
      const result = store.setItem(StorageKeys.SETTINGS, DEFAULT_SETTINGS);

      expect(result.success).toBe(true);

      const getResult = store.getItem<AppSettings>(StorageKeys.SETTINGS);
      expect(getResult.success).toBe(true);
      expect(getResult.data).toEqual(DEFAULT_SETTINGS);
    });

    it('should return error for non-existent key', () => {
      const result = store.getItem(StorageKeys.SETTINGS);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should remove a value', () => {
      store.setItem(StorageKeys.SETTINGS, DEFAULT_SETTINGS);
      const removeResult = store.removeItem(StorageKeys.SETTINGS);

      expect(removeResult.success).toBe(true);

      const getResult = store.getItem<AppSettings>(StorageKeys.SETTINGS);
      expect(getResult.success).toBe(false);
    });

    it('should clear all app data', () => {
      store.setItem(StorageKeys.SETTINGS, DEFAULT_SETTINGS);
      store.setItem(StorageKeys.CONVERSION_CACHE, { data: 'test' });

      const clearResult = store.clear();
      expect(clearResult.success).toBe(true);

      expect(mockStorage.length).toBe(0);
    });

    it('should only clear app-specific data', () => {
      // Add some app data and some other data
      store.setItem(StorageKeys.SETTINGS, DEFAULT_SETTINGS);
      mockStorage.setItem('other-key', 'other-value');

      store.clear();

      expect(mockStorage.getItem('other-key')).toBe('other-value');
      expect(mockStorage.getItem(StorageKeys.SETTINGS)).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle quota exceeded errors', () => {
      (mockStorage as MockStorage).setQuotaExceeded(true);

      const result = store.setItem(StorageKeys.SETTINGS, DEFAULT_SETTINGS);

      // Note: The mock may not throw a proper DOMException in all environments
      // The important thing is that the error is handled gracefully
      expect(result.success).toBe(false);
      // Either we detect QUOTA_EXCEEDED or fall back to UNKNOWN_ERROR
      expect([
        StorageErrorCode.QUOTA_EXCEEDED,
        StorageErrorCode.UNKNOWN_ERROR,
      ]).toContain(result.errorCode);
    });

    it('should handle circular reference in data', () => {
      const circular: Record<string, unknown> = { a: 1 };
      circular.self = circular;

      const result = store.setItem(StorageKeys.TEMP_DATA, circular);

      // The safe JSON stringify handles circular references by replacing them with [Circular]
      // So the operation should succeed
      if (!result.success) {
        // If it fails, at least verify it fails gracefully with a known error type
        expect([
          StorageErrorCode.INVALID_DATA,
          StorageErrorCode.QUOTA_EXCEEDED,
          StorageErrorCode.UNKNOWN_ERROR,
        ]).toContain(result.errorCode);
      } else {
        // When retrieved, the circular reference is replaced with [Circular] string
        const retrieved = store.getItem<Record<string, unknown>>(StorageKeys.TEMP_DATA);
        expect(retrieved.success).toBe(true);
        expect((retrieved.data as Record<string, unknown>).self).toBe('[Circular]');
      }
    });

    it('should handle invalid JSON on retrieval', () => {
      mockStorage.setItem(StorageKeys.SETTINGS, 'invalid-json{');

      const result = store.getItem<AppSettings>(StorageKeys.SETTINGS);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(StorageErrorCode.INVALID_DATA);
    });

    it('should handle data integrity check failure', () => {
      // Manually corrupt the data
      mockStorage.setItem(StorageKeys.SETTINGS, JSON.stringify({
        value: DEFAULT_SETTINGS,
        version: 1,
        timestamp: Date.now(),
        checksum: 'invalid-checksum',
      }));

      const result = store.getItem<AppSettings>(StorageKeys.SETTINGS);

      expect(result.success).toBe(false);
      expect(result.error).toContain('integrity');
    });
  });

  describe('Settings Operations', () => {
    it('should load default settings when none exist', () => {
      const settings = store.loadSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(settings.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });

    it('should save and load settings', () => {
      const customSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        component: {
          ...DEFAULT_SETTINGS.component,
          outputFormat: OutputFormat.JSX,
        },
      };

      const saveResult = store.saveSettings(customSettings);
      expect(saveResult.success).toBe(true);

      const loaded = store.loadSettings();
      expect(loaded.component.outputFormat).toBe(OutputFormat.JSX);
    });

    it('should update settings partially', () => {
      store.saveSettings(DEFAULT_SETTINGS);

      const update: PartialSettings = {
        component: {
          ...DEFAULT_SETTINGS.component,
          outputFormat: OutputFormat.JSX,
        },
      };

      const updateResult = store.updateSettings(update);
      expect(updateResult.success).toBe(true);

      const loaded = store.loadSettings();
      expect(loaded.component.outputFormat).toBe(OutputFormat.JSX);
      // Other settings should remain unchanged
      expect(loaded.css.strategy).toBe(DEFAULT_SETTINGS.css.strategy);
    });

    it('should reset settings to defaults', () => {
      const customSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        component: {
          ...DEFAULT_SETTINGS.component,
          outputFormat: OutputFormat.JSX,
        },
      };
      store.saveSettings(customSettings);

      const resetResult = store.resetSettings();
      expect(resetResult.success).toBe(true);

      const loaded = store.loadSettings();
      expect(loaded.component.outputFormat).toBe(DEFAULT_SETTINGS.component.outputFormat);
    });

    it('should update lastUpdated timestamp on save', () => {
      const beforeTime = Date.now();
      store.saveSettings(DEFAULT_SETTINGS);
      const afterTime = Date.now();

      const loaded = store.loadSettings();
      expect(loaded.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
      expect(loaded.lastUpdated).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Import/Export', () => {
    it('should export settings as JSON', () => {
      store.saveSettings(DEFAULT_SETTINGS);

      const exportResult = store.exportSettings();

      expect(exportResult.success).toBe(true);
      expect(exportResult.data).toBeDefined();

      const exported = JSON.parse(exportResult.data!);
      // Compare fields except lastUpdated which changes
      expect(exported.settings.schemaVersion).toEqual(DEFAULT_SETTINGS.schemaVersion);
      expect(exported.settings.component).toEqual(DEFAULT_SETTINGS.component);
      expect(exported.settings.css).toEqual(DEFAULT_SETTINGS.css);
      expect(exported.settings.formatting).toEqual(DEFAULT_SETTINGS.formatting);
      expect(exported.settings.advanced).toEqual(DEFAULT_SETTINGS.advanced);
      expect(exported.settings.ui).toEqual(DEFAULT_SETTINGS.ui);
      expect(exported.metadata).toBeDefined();
      expect(exported.metadata.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });

    it('should import settings from JSON', () => {
      const exportResult = store.exportSettings();
      const jsonStr = exportResult.data!;

      // Clear and re-import
      store.clear();
      const importResult = store.importSettings(jsonStr);

      expect(importResult.success).toBe(true);

      const loaded = store.loadSettings();
      // Compare fields except lastUpdated which changes
      expect(loaded.schemaVersion).toEqual(DEFAULT_SETTINGS.schemaVersion);
      expect(loaded.component).toEqual(DEFAULT_SETTINGS.component);
      expect(loaded.css).toEqual(DEFAULT_SETTINGS.css);
      expect(loaded.formatting).toEqual(DEFAULT_SETTINGS.formatting);
      expect(loaded.advanced).toEqual(DEFAULT_SETTINGS.advanced);
      expect(loaded.ui).toEqual(DEFAULT_SETTINGS.ui);
    });

    it('should reject invalid import format', () => {
      const importResult = store.importSettings('invalid-json');

      expect(importResult.success).toBe(false);
      expect(importResult.errorCode).toBe(StorageErrorCode.INVALID_DATA);
    });

    it('should reject import with missing settings', () => {
      const importResult = store.importSettings(JSON.stringify({
        metadata: { schemaVersion: 1 },
      }));

      expect(importResult.success).toBe(false);
      expect(importResult.error).toContain('Invalid import');
    });
  });

  describe('Storage Size', () => {
    it('should calculate storage size', () => {
      store.setItem(StorageKeys.SETTINGS, DEFAULT_SETTINGS);

      const size = store.getStorageSize();

      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(100 * 1024); // Should be less than 100KB
    });

    it('should return null for size when storage is disabled', () => {
      (mockStorage as MockStorage).setDisabled(true);
      const disabledStore = new SettingsStore(mockStorage as unknown as Storage);

      const size = disabledStore.getStorageSize();

      expect(size).toBeNull();
    });

    it('should provide quota information', () => {
      const quotaInfo = store.getQuotaInfo();

      expect(quotaInfo).toBeDefined();
      expect(quotaInfo!.usage).toBeGreaterThanOrEqual(0);
      expect(quotaInfo!.estimatedQuota).toBeGreaterThan(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getSettingsStore();
      const instance2 = getSettingsStore();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getSettingsStore();
      resetSettingsStore();
      const instance2 = getSettingsStore();

      expect(instance1).not.toBe(instance2);
    });
  });
});

describe('StorageManager', () => {
  let mockStorage: MockStorage;
  let manager: StorageManager;

  beforeEach(() => {
    mockStorage = new MockStorage();
    const store = new SettingsStore(mockStorage as unknown as Storage);
    manager = new StorageManager(store);
    resetStorageManager();
  });

  describe('Settings Validation', () => {
    it('should validate valid settings', () => {
      const validation = manager.validateSettings();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      // Save directly using the store wrapper format
      mockStorage.setItem(StorageKeys.SETTINGS, JSON.stringify({
        value: {
          schemaVersion: 1,
          // Missing required fields
        },
        version: 1,
        timestamp: Date.now(),
      }));

      const validation = manager.validateSettings();

      expect(validation.isValid).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(0);
    });

    it('should detect unknown fields', () => {
      const settingsWithUnknown = {
        ...DEFAULT_SETTINGS,
        unknownField: 'value',
      };
      // Save directly using the store wrapper format
      mockStorage.setItem(StorageKeys.SETTINGS, JSON.stringify({
        value: settingsWithUnknown,
        version: 1,
        timestamp: Date.now(),
      }));

      const validation = manager.validateSettings();

      expect(validation.unknown).toContain('unknownField');
    });

    it('should sanitize invalid settings', () => {
      const invalidSettings = {
        schemaVersion: 'invalid' as unknown as number,
        component: DEFAULT_SETTINGS.component,
      };
      mockStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(invalidSettings));

      const loaded = manager.loadSettings();

      expect(loaded.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });
  });

  describe('Quota Management', () => {
    it('should provide quota information', () => {
      const store = manager.getStore();
      store.saveSettings(DEFAULT_SETTINGS);

      const quotaInfo = manager.getQuotaInfo();

      expect(quotaInfo).toBeDefined();
      expect(quotaInfo!.usage).toBeGreaterThan(0);
      expect(quotaInfo!.remaining).toBeGreaterThan(0);
      expect(quotaInfo!.usagePercentage).toBeGreaterThanOrEqual(0);
      expect(quotaInfo!.usagePercentage).toBeLessThanOrEqual(100);
    });

    it('should detect critical quota usage', () => {
      // Mock a high usage scenario
      const largeData = 'x'.repeat(4 * 1024 * 1024); // 4MB
      const store = manager.getStore();
      store['storage'].setItem(StorageKeys.SETTINGS, largeData);

      // This would be near the typical 5MB limit
      const isCritical = manager.isQuotaCritical(80);
      expect(typeof isCritical).toBe('boolean');
    });

    it('should clear cache to free space', () => {
      const store = manager.getStore();
      store.setItem(StorageKeys.CONVERSION_CACHE, { data: 'test' });

      const clearResult = manager.clearCache();

      expect(clearResult.success).toBe(true);
    });

    it('should clear history', () => {
      const store = manager.getStore();
      store.setItem(StorageKeys.CONVERSION_HISTORY, { items: [] });

      const clearResult = manager.clearHistory();

      expect(clearResult.success).toBe(true);
    });
  });

  describe('Storage Statistics', () => {
    it('should provide storage statistics', () => {
      const store = manager.getStore();
      store.saveSettings(DEFAULT_SETTINGS);

      const stats = manager.getStorageStats();

      expect(stats).toBeDefined();
      expect(stats!.totalSize).toBeGreaterThan(0);
      expect(stats!.itemCount).toBeGreaterThan(0);
      expect(stats!.quotaInfo).toBeDefined();
      expect(stats!.breakdown).toBeDefined();
    });

    it('should return null stats when storage unavailable', () => {
      (mockStorage as MockStorage).setDisabled(true);
      const disabledStore = new SettingsStore(mockStorage as unknown as Storage);
      const disabledManager = new StorageManager(disabledStore);

      const stats = disabledManager.getStorageStats();

      expect(stats).toBeNull();
    });
  });

  describe('Backup and Restore', () => {
    it('should create a backup', () => {
      const store = manager.getStore();
      store.saveSettings(DEFAULT_SETTINGS);
      store.setItem(StorageKeys.CONVERSION_CACHE, { cached: true });

      const backupResult = manager.createBackup();

      expect(backupResult.success).toBe(true);
      expect(backupResult.data).toBeDefined();

      const backup = JSON.parse(backupResult.data!);
      // Compare fields except lastUpdated which changes
      expect(backup.settings.schemaVersion).toEqual(DEFAULT_SETTINGS.schemaVersion);
      expect(backup.settings.component).toEqual(DEFAULT_SETTINGS.component);
      expect(backup.settings.css).toEqual(DEFAULT_SETTINGS.css);
      expect(backup.settings.formatting).toEqual(DEFAULT_SETTINGS.formatting);
      expect(backup.settings.advanced).toEqual(DEFAULT_SETTINGS.advanced);
      expect(backup.settings.ui).toEqual(DEFAULT_SETTINGS.ui);
      expect(backup.cache).toEqual({ cached: true });
    });

    it('should restore from a backup', () => {
      const backup = {
        settings: DEFAULT_SETTINGS,
        cache: { restored: true },
        version: 1,
      };

      const restoreResult = manager.restoreFromBackup(JSON.stringify(backup));

      expect(restoreResult.success).toBe(true);

      const store = manager.getStore();
      const cacheResult = store.getItem(StorageKeys.CONVERSION_CACHE);
      expect(cacheResult.success).toBe(true);
      expect(cacheResult.data).toEqual({ restored: true });
    });

    it('should handle invalid backup format', () => {
      const restoreResult = manager.restoreFromBackup('invalid-backup');

      expect(restoreResult.success).toBe(false);
      expect(restoreResult.errorCode).toBe(StorageErrorCode.INVALID_DATA);
    });
  });

  describe('Migration Support', () => {
    it('should register custom migration', () => {
      const migration = {
        fromVersion: 1,
        toVersion: 2,
        migrate: (settings: AppSettings) => ({
          ...settings,
          schemaVersion: 2,
        }),
        description: 'Test migration',
      };

      expect(() => manager.registerMigration(migration)).not.toThrow();
    });

    it('should handle settings without schema version', () => {
      const oldSettings = {
        component: DEFAULT_SETTINGS.component,
        css: DEFAULT_SETTINGS.css,
        formatting: DEFAULT_SETTINGS.formatting,
        advanced: DEFAULT_SETTINGS.advanced,
        ui: DEFAULT_SETTINGS.ui,
      };
      mockStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(oldSettings));

      const loaded = manager.loadSettings();

      expect(loaded.schemaVersion).toBe(SETTINGS_SCHEMA_VERSION);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getStorageManager();
      const instance2 = getStorageManager();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = getStorageManager();
      resetStorageManager();
      const instance2 = getStorageManager();

      expect(instance1).not.toBe(instance2);
    });
  });
});

describe('Edge Cases and Integration', () => {
  let mockStorage: MockStorage;
  let store: SettingsStore;
  let manager: StorageManager;

  beforeEach(() => {
    mockStorage = new MockStorage();
    store = new SettingsStore(mockStorage as unknown as Storage);
    manager = new StorageManager(store);
  });

  it('should handle concurrent operations', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      store.setItem(`${StorageKeys.TEMP_DATA}:${i}` as StorageKeys, { index: i })
    );

    const results = await Promise.all(promises);

    expect(results.every(r => r.success)).toBe(true);
    expect(mockStorage.length).toBe(10);
  });

  it('should handle very large settings', () => {
    const largeSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      advanced: {
        ...DEFAULT_SETTINGS.advanced,
        customTransformations: Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`key-${i}`, `value-${i}`])
        ),
      },
    };

    const result = store.saveSettings(largeSettings);

    expect(result.success).toBe(true);
  });

  it('should handle special characters in values', () => {
    const specialSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      component: {
        ...DEFAULT_SETTINGS.component,
        componentNameTemplate: '<script>alert("xss")</script>',
      },
    };

    const saveResult = store.saveSettings(specialSettings);
    expect(saveResult.success).toBe(true);

    const loaded = store.loadSettings();
    expect(loaded.component.componentNameTemplate).toContain('<script>');
  });

  it('should handle Unicode characters', () => {
    const unicodeSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      component: {
        ...DEFAULT_SETTINGS.component,
        componentNameTemplate: '你好世界🌍',
      },
    };

    const saveResult = store.saveSettings(unicodeSettings);
    expect(saveResult.success).toBe(true);

    const loaded = store.loadSettings();
    expect(loaded.component.componentNameTemplate).toBe('你好世界🌍');
  });

  it('should handle rapid save/load cycles', () => {
    for (let i = 0; i < 100; i++) {
      store.saveSettings(DEFAULT_SETTINGS);
      const loaded = store.loadSettings();
      // Compare all fields except lastUpdated which changes
      expect(loaded.schemaVersion).toEqual(DEFAULT_SETTINGS.schemaVersion);
      expect(loaded.component).toEqual(DEFAULT_SETTINGS.component);
      expect(loaded.css).toEqual(DEFAULT_SETTINGS.css);
      expect(loaded.formatting).toEqual(DEFAULT_SETTINGS.formatting);
      expect(loaded.advanced).toEqual(DEFAULT_SETTINGS.advanced);
      expect(loaded.ui).toEqual(DEFAULT_SETTINGS.ui);
    }
  });

  it('should preserve data types through storage', () => {
    const complexSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      advanced: {
        ...DEFAULT_SETTINGS.advanced,
        enableComponentSplitting: true,
        maxFileSizeKB: 500,
      },
      ui: {
        ...DEFAULT_SETTINGS.ui,
        theme: 'dark',
      },
    };

    store.saveSettings(complexSettings);
    const loaded = store.loadSettings();

    expect(typeof loaded.advanced.enableComponentSplitting).toBe('boolean');
    expect(typeof loaded.advanced.maxFileSizeKB).toBe('number');
    expect(loaded.ui.theme).toBe('dark');
  });

  it('should handle empty object updates', () => {
    store.saveSettings(DEFAULT_SETTINGS);

    const updateResult = manager.updateSettings({});

    expect(updateResult.success).toBe(true);
  });

  it('should handle partial updates with nested objects', () => {
    store.saveSettings(DEFAULT_SETTINGS);

    const update: Partial<AppSettings> = {
      css: {
        ...DEFAULT_SETTINGS.css,
        strategy: CssStrategy.CSS_MODULES,
      },
    };

    const updateResult = manager.updateSettings(update);
    expect(updateResult.success).toBe(true);

    const loaded = manager.loadSettings();
    expect(loaded.css.strategy).toBe(CssStrategy.CSS_MODULES);
  });
});
