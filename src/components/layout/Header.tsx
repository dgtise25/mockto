/**
 * Header Component
 * App header with navigation and actions
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Github,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showNavigation?: boolean;
  showThemeToggle?: boolean;
  showGitHubLink?: boolean;
  showSearch?: boolean;
  showShortcuts?: boolean;
  githubUrl?: string;
  version?: string;
  activeLink?: string;
  onSettingsClick?: () => void;
  onThemeToggle?: () => void;
  onSearch?: () => void;
  breadcrumbs?: Array<{ label: string; href: string }>;
  className?: string;
  sticky?: boolean;
}

const DEFAULT_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Converter', href: '/converter' },
  { label: 'Documentation', href: '/docs' },
  { label: 'About', href: '/about' },
];

export const Header: React.FC<HeaderProps> = ({
  title = 'HTML to React Converter',
  subtitle,
  showNavigation,
  showThemeToggle = true,
  showGitHubLink = true,
  showSearch = true,
  githubUrl = 'https://github.com',
  version,
  activeLink,
  onSettingsClick,
  onThemeToggle,
  onSearch,
  breadcrumbs,
  className,
  sticky = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Check system theme preference
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleThemeToggle = useCallback(() => {
    if (onThemeToggle) {
      onThemeToggle();
    } else {
      setIsDark((prev) => {
        const newValue = !prev;
        document.documentElement.classList.toggle('dark', newValue);
        return newValue;
      });
    }
  }, [onThemeToggle]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header
      data-testid="app-header"
      className={cn(
        'border-b bg-background',
        sticky && 'sticky top-0 z-40',
        className
      )}
    >
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        Skip to content
      </a>

      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <div
              className="p-2 bg-primary/10 rounded-lg"
              data-testid="app-logo"
            >
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
            {version && (
              <span className="text-xs px-2 py-1 bg-muted rounded-full">
                v{version}
              </span>
            )}
          </div>

          {/* Desktop navigation */}
          {showNavigation && !isCompact && (
            <nav
              role="navigation"
              aria-label="Main navigation"
              className="hidden md:flex items-center gap-6"
            >
              {DEFAULT_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    activeLink === link.href.toLowerCase()
                      ? 'text-primary active'
                      : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {showSearch && !isCompact && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onSearch}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {showGitHubLink && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository"
              >
                <Button type="button" variant="ghost" size="icon">
                  <Github className="h-5 w-5" />
                </Button>
              </a>
            )}

            {onSettingsClick && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onSettingsClick}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}

            {showThemeToggle && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Mobile menu button */}
            {showNavigation && isCompact && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="py-2 border-t"
          >
            <ol className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <a
                    href={crumb.href}
                    className={cn(
                      index === breadcrumbs.length - 1
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {crumb.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Mobile menu */}
        {showNavigation && isCompact && (
          <div
            className={cn(
              'md:hidden border-t',
              isMobileMenuOpen ? 'block' : 'hidden'
            )}
          >
            <nav
              role="navigation"
              aria-label="Mobile navigation"
              className={cn(
                'py-4 space-y-2',
                isMobileMenuOpen && 'mobile-open'
              )}
            >
              {DEFAULT_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'block px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    activeLink === link.href.toLowerCase()
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Live region for announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {isMobileMenuOpen ? 'Menu opened' : ''}
      </div>
    </header>
  );
};

export default Header;
