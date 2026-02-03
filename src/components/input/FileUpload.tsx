/**
 * FileUpload Component
 * Drag-drop file upload component for HTML files
 */

import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, X, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  onFileUpload: (file: File) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
}

interface FileState {
  file: File | null;
  loading: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  accept = '.html,.htm',
  multiple = false,
  maxSize = 1024 * 1024, // 1MB default
  disabled = false,
  className,
}) => {
  const [dragState, setDragState] = useState<'idle' | 'drag-over' | 'error'>('idle');
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    loading: false,
    error: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const validTypes = accept.split(',').map((type) => type.trim());
      const fileExtension = '.' + file.name.split('.').pop();
      const isValidType = validTypes.some((type) => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        return file.type === type;
      });

      if (!isValidType) {
        return `Please upload an HTML file (.html or .htm)`;
      }

      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
        return `File size exceeds ${maxSizeMB}MB limit`;
      }

      return null;
    },
    [accept, maxSize]
  );

  const handleFile = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        setFileState({ file: null, loading: false, error });
        setDragState('error');
        return;
      }

      setFileState({ file, loading: true, error: null });

      try {
        await onFileUpload(file);
        setFileState({ file, loading: false, error: null });
        setDragState('idle');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
        setFileState({ file: null, loading: false, error: errorMessage });
        setDragState('error');
      }
    },
    [validateFile, onFileUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = multiple ? files[0] : files[0]; // Handle first file
        handleFile(file);
      } else {
        setDragState('idle');
      }
    },
    [disabled, multiple, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!disabled) {
        setDragState('drag-over');
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState('idle');
    },
    []
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = multiple ? files[0] : files[0];
        handleFile(file);
      }
    },
    [multiple, handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !fileState.loading) {
      inputRef.current?.click();
    }
  }, [disabled, fileState.loading]);

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFileState({ file: null, loading: false, error: null });
    setDragState('idle');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full', className)}>
      <Card
        data-testid="file-upload-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed p-8 transition-all cursor-pointer',
          'hover:border-primary/50 hover:bg-accent/50',
          dragState === 'drag-over' && 'border-primary bg-accent drag-over',
          dragState === 'error' && 'border-destructive bg-destructive/10',
          disabled && 'cursor-not-allowed opacity-50',
          fileState.loading && 'pointer-events-none'
        )}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload HTML file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          data-testid="file-input"
          disabled={disabled}
        />

        {/* Loading state */}
        {fileState.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loading-spinner" />
          </div>
        )}

        {/* Upload icon */}
        {!fileState.file && !fileState.error && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10" data-testid="upload-icon">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">
                Drag and drop your HTML file here
              </h3>
              <p className="text-sm text-muted-foreground">
                or click to browse from your computer
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: {formatFileSize(maxSize)}
              </p>
            </div>
            <Button type="button" variant="outline" disabled={disabled}>
              Browse Files
            </Button>
          </div>
        )}

        {/* File info */}
        {fileState.file && !fileState.error && (
          <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{fileState.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(fileState.file.size)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearFile}
              aria-label="Clear file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Error state */}
        {fileState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fileState.error}</AlertDescription>
          </Alert>
        )}
      </Card>
    </div>
  );
};

export default FileUpload;
