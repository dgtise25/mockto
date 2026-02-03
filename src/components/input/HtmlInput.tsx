/**
 * HtmlInput Component
 * Textarea component with HTML syntax highlighting
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Copy, Check, X, Code } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HtmlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  readOnly?: boolean;
  minRows?: number;
  maxRows?: number;
  showLineNumbers?: boolean;
  showClearButton?: boolean;
  onCopy?: () => void;
  className?: string;
  id?: string;
}

export const HtmlInput: React.FC<HtmlInputProps> = ({
  value,
  onChange,
  placeholder = '<div>Your HTML here...</div>',
  label,
  helperText,
  error,
  readOnly = false,
  minRows = 5,
  maxRows = 20,
  showLineNumbers = false,
  showClearButton = true,
  onCopy,
  className,
  id,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  // Update line count when value changes
  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(Math.max(lines, minRows));
  }, [value, minRows]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const updateHeight = () => {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const minHeight = minRows * lineHeight;
      const maxHeight = maxRows * lineHeight;

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    };

    updateHeight();
  }, [value, minRows, maxRows]);

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
    } else {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [value, onCopy]);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle Tab key for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);

        // Restore cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }

      // Handle Ctrl/Cmd + Enter for formatting
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Could trigger format function here
      }
    },
    [value, onChange]
  );

  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={cn('w-full syntax-highlight', className)} data-testid="html-input-container">
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label}
        </Label>
      )}

      <div className="relative">
        {/* Line numbers */}
        {showLineNumbers && (
          <div
            data-testid="line-numbers"
            className="absolute left-0 top-0 bottom-0 w-10 bg-muted border-r border-border rounded-l-md overflow-hidden"
            aria-hidden="true"
          >
            <div className="flex flex-col items-center py-3 text-xs text-muted-foreground font-mono leading-6">
              {lineNumbers.map((num) => (
                <span key={num}>{num}</span>
              ))}
            </div>
          </div>
        )}

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={cn(
            'font-mono text-sm resize-none',
            showLineNumbers && 'pl-12',
            error && 'border-destructive focus:border-destructive',
            'transition-colors'
          )}
          style={{ minHeight: `${minRows * 1.5}rem` }}
          onKeyDown={handleKeyDown}
          aria-describedby={helperText || error ? `${id}-description` : undefined}
          aria-invalid={!!error}
        />

        {/* Action buttons */}
        {!readOnly && (
          <div className="absolute right-2 top-2 flex gap-1">
            {showClearButton && value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClear}
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Syntax highlight indicator */}
        <div className="absolute left-2 top-2">
          <Code className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </div>

      {/* Helper text and error */}
      {(helperText || error) && (
        <div
          id={`${id}-description`}
          className={cn(
            'mt-1 text-sm',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {error || helperText}
        </div>
      )}

      {/* Character count */}
      <div className="mt-1 text-xs text-muted-foreground">
        {value.length} character{value.length !== 1 ? 's' : ''}
        {value.includes('\n') && ` • ${value.split('\n').length} line${value.split('\n').length > 1 ? 's' : ''}`}
      </div>
    </div>
  );
};

export default HtmlInput;
