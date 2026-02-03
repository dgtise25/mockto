/**
 * CodePreview Component
 * Syntax highlighted code display component
 */

import React, { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Maximize2, Minimize2, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface CodePreviewProps {
  code: string;
  language?: string;
  filename?: string;
  lineNumbers?: boolean;
  wrapLines?: boolean;
  theme?: 'light' | 'dark';
  loading?: boolean;
  onCopy?: () => void;
  className?: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  language = 'tsx',
  filename,
  lineNumbers = true,
  wrapLines = false,
  theme = 'dark',
  loading = false,
  onCopy,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyError(null);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopyError('Failed to copy code');
      setTimeout(() => setCopyError(null), 3000);
    }
  }, [code, onCopy]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev);
  }, []);

  // Get language display name
  const languageDisplay = language.toUpperCase();

  return (
    <div
      data-testid="code-preview"
      className={cn(
        'relative flex flex-col',
        fullscreen && 'fixed inset-0 z-50 bg-background p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          {filename && (
            <span className="text-sm font-medium">{filename}</span>
          )}
          {!filename && (
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
              {languageDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Copy feedback */}
          {copyError && (
            <Alert variant="destructive" className="py-1 px-2 mr-2">
              <AlertDescription className="text-xs">{copyError}</AlertDescription>
            </Alert>
          )}

          {copied && (
            <span className="text-xs text-green-500 dark:text-green-400 mr-2">
              Copied!
            </span>
          )}

          {/* Wrap toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="text-xs"
            title={wrapLines ? 'Disable wrap' : 'Enable wrap'}
          >
            {wrapLines ? 'Wrap' : 'No Wrap'}
          </Button>

          {/* Copy button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy code"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>

          {/* Fullscreen toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <Card
        data-testid="code-container"
        className={cn(
          'flex-1 overflow-auto rounded-t-none',
          fullscreen && 'border-none h-full'
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !code ? (
          <div
            className="flex flex-col items-center justify-center h-64 text-muted-foreground"
            data-testid="empty-state"
          >
            <FileCode className="h-12 w-12 mb-2 opacity-50" data-testid="empty-state-icon" />
            <p>No code to display</p>
            <p className="text-sm">Upload an HTML file to get started</p>
          </div>
        ) : (
          <div
            data-testid="code-content"
            className={cn(
              'relative',
              wrapLines && 'wrap'
            )}
          >
            <SyntaxHighlighter
              language={language}
              style={theme === 'dark' ? vscDarkPlus : vs}
              showLineNumbers={lineNumbers}
              wrapLines={wrapLines}
              customStyle={{
                margin: 0,
                borderRadius: '0 0 0.5rem 0.5rem',
                background: 'transparent',
                fontSize: '0.875rem',
                minHeight: '200px',
              }}
              lineNumberStyle={{
                minWidth: '2.5rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                color: 'inherit',
                opacity: 0.5,
                fontSize: '0.75rem',
                userSelect: 'none',
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CodePreview;
