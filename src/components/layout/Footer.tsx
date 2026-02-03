/**
 * Footer Component
 * App footer with links and information
 */

import React, { useCallback, useState } from 'react';
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  Heart,
  ArrowUp,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FooterProps {
  appName?: string;
  showVersion?: boolean;
  version?: string;
  showLinks?: boolean;
  showSocialLinks?: boolean;
  showNewsletter?: boolean;
  showThemeToggle?: boolean;
  showBackToTop?: boolean;
  license?: string;
  links?: {
    documentation?: string;
    github?: string;
    about?: string;
  };
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
  onNewsletterSubscribe?: (email: string) => void;
  onThemeToggle?: () => void;
  customLinks?: Array<{ label: string; href: string }>;
  className?: string;
}

const DEFAULT_LINKS = {
  documentation: '/docs',
  github: 'https://github.com',
  about: '/about',
};

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC<FooterProps> = ({
  appName = 'HTML to React Converter',
  showVersion,
  version,
  showLinks,
  showSocialLinks,
  showNewsletter,
  showThemeToggle = false,
  showBackToTop = true,
  license = 'MIT',
  links = DEFAULT_LINKS,
  socialLinks,
  onNewsletterSubscribe,
  onThemeToggle,
  customLinks,
  className,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const handleSubscribe = useCallback(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      return;
    }

    setEmailError(null);

    if (onNewsletterSubscribe) {
      onNewsletterSubscribe(email);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  }, [email, onNewsletterSubscribe]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <footer
      role="contentinfo"
      className={cn('border-t bg-muted/30 mt-auto', className)}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{appName}</h3>
            <p className="text-sm text-muted-foreground">
              Convert HTML mockups to React components with ease.
            </p>

            {/* Version */}
            {showVersion && version && (
              <div className="text-sm">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                  v{version}
                </span>
              </div>
            )}

            {/* Theme toggle */}
            {showThemeToggle && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleThemeToggle}
                className="w-full"
              >
                {isDark ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Links section */}
          {showLinks && (
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <nav aria-label="Footer navigation" className="space-y-2">
                <a
                  href={links.documentation}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documentation
                </a>
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
                <a
                  href={links.about}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </a>
                {customLinks?.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Social links */}
          {showSocialLinks && (
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-2">
                {socialLinks?.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    <Button type="button" variant="outline" size="icon">
                      <Twitter className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {links.github && (
                  <a
                    href={links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                  >
                    <Button type="button" variant="outline" size="icon">
                      <Github className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {socialLinks?.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    <Button type="button" variant="outline" size="icon">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </a>
                )}
                {socialLinks?.email && (
                  <a
                    href={`mailto:${socialLinks.email}`}
                    aria-label="Email"
                  >
                    <Button type="button" variant="outline" size="icon">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Newsletter section */}
          {showNewsletter && (
            <div>
              <h4 className="font-semibold mb-4">Stay Updated</h4>
              <div className="space-y-2">
                <Label htmlFor="footer-email" className="text-sm">
                  Subscribe to updates
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="footer-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      'flex-1',
                      emailError && 'border-destructive'
                    )}
                    aria-invalid={!!emailError}
                  />
                  <Button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={subscribed}
                  >
                    {subscribed ? 'Subscribed!' : 'Subscribe'}
                  </Button>
                </div>
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            Copyright © {CURRENT_YEAR} {appName}. Made with{' '}
            <Heart className="h-3 w-3 inline text-red-500 fill-red-500" />
          </p>

          {/* License */}
          {license && (
            <a
              href={`https://opensource.org/licenses/${license.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {license} License
            </a>
          )}

          {/* Back to top */}
          {showBackToTop && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={scrollToTop}
              aria-label="Back to top"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Top
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
