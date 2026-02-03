/**
 * File Handler - Milestone 8
 *
 * Handles File System Access API with progressive enhancement.
 * Falls back to traditional download when API is not available.
 */

import JSZip from 'jszip';
import type {
  FileSystemOptions,
  FileSystemResult,
  ZipGenerationResult,
} from '@/types/assets.types';

/**
 * Type guard for File System Access API
 */
interface FileSystemAccessAPI {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: any;
  }) => Promise<FileSystemDirectoryHandle>;
}

/**
 * File System Access API handler with progressive enhancement
 */
export class FileHandler {
  private currentDirectoryHandle: FileSystemDirectoryHandle | undefined = undefined;
  private currentDownloadUrl: string | null = null;

  /**
   * Check if File System Access API is supported
   */
  isFileSystemAPISupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Open directory picker and get handle
   */
  async openDirectoryPicker(options: FileSystemOptions = {}): Promise<FileSystemResult> {
    // If already have a handle, use it
    if (options.directoryHandle) {
      this.currentDirectoryHandle = options.directoryHandle;
      return {
        success: true,
        directoryHandle: options.directoryHandle,
        filesWritten: [],
      };
    }

    // Check API support
    if (!this.isFileSystemAPISupported()) {
      return {
        success: true,
        filesWritten: [],
        cancelled: false,
      };
    }

    try {
      const pickerOptions: {
        id?: string;
        mode?: 'read' | 'readwrite';
        startIn?: any;
      } = {
        mode: 'readwrite',
      };

      // Set suggested directory name as ID
      if (options.suggestedDirectoryName) {
        pickerOptions.id = options.suggestedDirectoryName;
      }

      // Set startIn directory if supported
      if (options.startIn && this.isValidStartIn(options.startIn)) {
        pickerOptions.startIn = options.startIn;
      }

      const handle = await (window as unknown as FileSystemAccessAPI).showDirectoryPicker!(pickerOptions);

      this.currentDirectoryHandle = handle;

      return {
        success: true,
        directoryHandle: handle,
        filesWritten: [],
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          filesWritten: [],
          cancelled: true,
          error: 'User cancelled the directory picker',
        };
      }

      return {
        success: false,
        filesWritten: [],
        cancelled: false,
        error: `Failed to open directory: ${error}`,
      };
    }
  }

  /**
   * Create directory structure
   */
  async createDirectoryStructure(
    directories: string[],
    options: FileSystemOptions = {}
  ): Promise<FileSystemResult> {
    if (!this.currentDirectoryHandle) {
      const openResult = await this.openDirectoryPicker(options);
      if (!openResult.success || !openResult.directoryHandle) {
        return openResult;
      }
    }

    const filesWritten: string[] = [];

    try {
      // Sort directories by depth (shallowest first)
      const sortedDirs = [...directories].sort((a, b) => {
        const aDepth = a.split('/').length;
        const bDepth = b.split('/').length;
        return aDepth - bDepth;
      });

      for (const dirPath of sortedDirs) {
        const parts = dirPath.split('/').filter(Boolean);
        let currentHandle = this.currentDirectoryHandle!;

        for (const part of parts) {
          try {
            currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
            filesWritten.push(`${currentHandle.name}/${part}`);
          } catch (error) {
            return {
              success: false,
              filesWritten,
              error: `Failed to create directory ${dirPath}: ${error}`,
            };
          }
        }
      }

      return {
        success: true,
        directoryHandle: this.currentDirectoryHandle,
        filesWritten,
      };
    } catch (error) {
      return {
        success: false,
        filesWritten,
        error: `Failed to create directories: ${error}`,
      };
    }
  }

  /**
   * Create standard project directories
   */
  async createProjectDirectories(options: FileSystemOptions = {}): Promise<FileSystemResult> {
    const dirs = ['src'];

    if (options.useSrcDirectory) {
      dirs.push('src/components', 'src/styles', 'src/assets', 'src/assets/images', 'src/assets/fonts');
    } else {
      dirs.push('components', 'styles', 'assets', 'assets/images', 'assets/fonts');
    }

    return this.createDirectoryStructure(dirs, options);
  }

  /**
   * Write a single text file
   */
  async writeFile(
    path: string,
    content: string,
    options: FileSystemOptions = {}
  ): Promise<FileSystemResult> {
    if (!this.currentDirectoryHandle) {
      const openResult = await this.openDirectoryPicker(options);
      if (!openResult.success || !openResult.directoryHandle) {
        return openResult;
      }
    }

    try {
      const parts = path.split('/').filter(Boolean);
      const fileName = parts.pop()!;
      let currentHandle = this.currentDirectoryHandle!;

      // Navigate to/create parent directories
      for (const part of parts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      // Create/write file
      const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return {
        success: true,
        directoryHandle: this.currentDirectoryHandle,
        filesWritten: [path],
      };
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          return {
            success: false,
            filesWritten: [],
            error: `Permission denied writing to ${path}`,
          };
        }
        if (error.name === 'QuotaExceededError') {
          return {
            success: false,
            filesWritten: [],
            error: `Storage quota exceeded writing to ${path}`,
          };
        }
      }

      return {
        success: false,
        filesWritten: [],
        error: `Failed to write ${path}: ${error}`,
      };
    }
  }

  /**
   * Write a binary file
   */
  async writeFileBinary(
    path: string,
    content: Blob,
    options: FileSystemOptions = {}
  ): Promise<FileSystemResult> {
    if (!this.currentDirectoryHandle) {
      const openResult = await this.openDirectoryPicker(options);
      if (!openResult.success || !openResult.directoryHandle) {
        return openResult;
      }
    }

    try {
      const parts = path.split('/').filter(Boolean);
      const fileName = parts.pop()!;
      let currentHandle = this.currentDirectoryHandle!;

      // Navigate to/create parent directories
      for (const part of parts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      // Create/write file
      const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return {
        success: true,
        directoryHandle: this.currentDirectoryHandle,
        filesWritten: [path],
      };
    } catch (error) {
      return {
        success: false,
        filesWritten: [],
        error: `Failed to write binary file ${path}: ${error}`,
      };
    }
  }

  /**
   * Write multiple files
   */
  async writeFiles(
    files: Record<string, string>,
    options: FileSystemOptions = {}
  ): Promise<FileSystemResult> {
    const allFilesWritten: string[] = [];
    const errors: string[] = [];

    for (const [path, content] of Object.entries(files)) {
      const result = await this.writeFile(path, content, options);
      if (result.success) {
        allFilesWritten.push(...result.filesWritten);
      } else {
        errors.push(result.error || `Failed to write ${path}`);
      }
    }

    return {
      success: errors.length === 0,
      directoryHandle: this.currentDirectoryHandle,
      filesWritten: allFilesWritten,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  }

  /**
   * Extract ZIP contents to a directory
   */
  async extractZipToDirectory(
    zipResult: ZipGenerationResult,
    options: FileSystemOptions = {}
  ): Promise<FileSystemResult> {
    if (!this.currentDirectoryHandle) {
      const openResult = await this.openDirectoryPicker(options);
      if (!openResult.success || !openResult.directoryHandle) {
        return openResult;
      }
    }

    const filesWritten: string[] = [];
    const errors: string[] = [];

    try {
      // Load ZIP
      const zip = new JSZip();
      const buffer = await zipResult.zipBlob.arrayBuffer();
      await zip.loadAsync(buffer);

      // Extract each file
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;

        try {
          const content = await zipEntry.async('blob');
          const result = await this.writeFileBinary(relativePath, content, {
            ...options,
            directoryHandle: this.currentDirectoryHandle!,
          });

          if (result.success) {
            filesWritten.push(...result.filesWritten);
          } else {
            errors.push(result.error || `Failed to extract ${relativePath}`);
          }
        } catch (error) {
          errors.push(`Failed to extract ${relativePath}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        directoryHandle: this.currentDirectoryHandle,
        filesWritten,
        error: errors.length > 0 ? errors.join('; ') : undefined,
      };
    } catch (error) {
      return {
        success: false,
        filesWritten,
        error: `Failed to extract ZIP: ${error}`,
      };
    }
  }

  /**
   * Save ZIP as traditional download (fallback)
   */
  async saveZipAsDownload(zipBlob: Blob, fileName: string): Promise<FileSystemResult & { downloadUrl?: string }> {
    this.cleanup();

    const url = URL.createObjectURL(zipBlob);
    this.currentDownloadUrl = url;

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      filesWritten: [],
      downloadUrl: url,
    };
  }

  /**
   * Verify a file was written correctly
   */
  async verifyFile(path: string, expectedContent: string): Promise<boolean> {
    if (!this.currentDirectoryHandle) return false;

    try {
      const parts = path.split('/').filter(Boolean);
      const fileName = parts.pop()!;
      let currentHandle = this.currentDirectoryHandle;

      // Navigate to file
      for (const part of parts) {
        currentHandle = await currentHandle.getDirectoryHandle(part);
      }

      const fileHandle = await currentHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const actualContent = await file.text();

      return actualContent === expectedContent;
    } catch {
      return false;
    }
  }

  /**
   * Check if startIn value is valid
   */
  private isValidStartIn(value: string): boolean {
    const validValues = ['desktop', 'documents', 'downloads', 'music', 'pictures', 'videos'];
    return validValues.includes(value);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.currentDownloadUrl) {
      URL.revokeObjectURL(this.currentDownloadUrl);
      this.currentDownloadUrl = null;
    }
    this.currentDirectoryHandle = undefined;
  }

  /**
   * Destructor
   */
  destroy(): void {
    this.cleanup();
  }
}

/**
 * Singleton instance for convenience
 */
let defaultFileHandler: FileHandler | null = null;

export function getFileHandler(): FileHandler {
  if (!defaultFileHandler) {
    defaultFileHandler = new FileHandler();
  }
  return defaultFileHandler;
}

export function resetFileHandler(): void {
  if (defaultFileHandler) {
    defaultFileHandler.destroy();
    defaultFileHandler = null;
  }
}

/**
 * Detect if we're in a secure context (required for File System Access API)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext;
}

/**
 * Check if the browser supports the File System Access API with all needed features
 */
export function getFileSystemAPICapabilities(): {
  supported: boolean;
  secureContext: boolean;
  showDirectoryPicker: boolean;
  writableFileStream: boolean;
} {
  return {
    supported: 'showDirectoryPicker' in window,
    secureContext: isSecureContext(),
    showDirectoryPicker: 'showDirectoryPicker' in window,
    writableFileStream: 'WritableStream' in window,
  };
}
