/**
 * OutputControls Component
 * Download/save buttons and output controls
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Download,
  Copy,
  Trash2,
  FileDown,
  FileArchive,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface OutputControlsProps {
  code: string;
  filename: string;
  onDownload: (format: 'tsx' | 'jsx' | 'zip') => void | Promise<void>;
  onCopy: () => void | Promise<void>;
  onClear: () => void;
  hasOutput: boolean;
  typescript?: boolean;
  onFormatChange?: (typescript: boolean) => void;
  defaultDownloadFormat?: 'tsx' | 'jsx' | 'zip';
  className?: string;
}

export const OutputControls: React.FC<OutputControlsProps> = ({
  code,
  filename,
  onDownload,
  onCopy,
  onClear,
  hasOutput,
  defaultDownloadFormat: _defaultDownloadFormat = 'tsx',
  className,
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isCompact, setIsCompact] = useState(false);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = useCallback(
    async (format: 'tsx' | 'jsx' | 'zip') => {
      try {
        await onDownload(format);
      } catch (err) {
        console.error('Download failed:', err);
      }
    },
    [onDownload]
  );

  const handleCopy = useCallback(async () => {
    try {
      await onCopy();
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  }, [onCopy]);

  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the output?')) {
      onClear();
    }
  }, [onClear]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      data-testid="output-controls"
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg',
        isCompact && 'compact',
        className
      )}
    >
      {/* File info */}
      {hasOutput && (
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-sm">
            <p className="font-medium truncate">{filename}</p>
            <p data-testid="file-size" className="text-xs text-muted-foreground">
              {formatFileSize(code.length)}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Copy status alert */}
        {copyStatus === 'success' && (
          <Alert className="py-1 px-2" data-testid="copy-success-alert">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">Copied to clipboard!</AlertDescription>
          </Alert>
        )}

        {copyStatus === 'error' && (
          <Alert variant="destructive" className="py-1 px-2" data-testid="copy-error-alert">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">Failed to copy</AlertDescription>
          </Alert>
        )}

        {/* Copy button */}
        <Button
          type="button"
          variant={hasOutput ? 'default' : 'outline'}
          size={isCompact ? 'icon' : 'sm'}
          onClick={handleCopy}
          disabled={!hasOutput}
          aria-label="Copy code"
          title={isCompact ? 'Copy' : undefined}
        >
          {isCompact ? (
            <Copy className="h-4 w-4" />
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>

        {/* Download dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={hasOutput ? 'default' : 'outline'}
              size={isCompact ? 'icon' : 'sm'}
              disabled={!hasOutput}
              aria-label="Download options"
            >
              {isCompact ? (
                <Download className="h-4 w-4" />
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDownload('tsx')}>
              <FileDown className="h-4 w-4 mr-2" />
              TypeScript (.tsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('jsx')}>
              <FileDown className="h-4 w-4 mr-2" />
              JavaScript (.jsx)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDownload('zip')}>
              <FileArchive className="h-4 w-4 mr-2" />
              ZIP Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear button */}
        <Button
          type="button"
          variant="ghost"
          size={isCompact ? 'icon' : 'sm'}
          onClick={handleClear}
          disabled={!hasOutput}
          aria-label="Clear output"
          title={isCompact ? 'Clear' : undefined}
        >
          {isCompact ? (
            <Trash2 className="h-4 w-4" />
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OutputControls;
