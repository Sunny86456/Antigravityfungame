import { Navbar } from './Navbar';
import { Instagram, Linkedin, Mail, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout Component
 * 
 * Dynamic navbar height handling:
 * - Navbar sets --navbar-height CSS variable via ResizeObserver
 * - Layout uses this variable for content padding
 * - Safe-area insets are handled in both navbar and content
 * 
 * Route-based behavior:
 * - Game routes: No navbar, no footer, full-screen immersion
 * - Other routes: Navbar with dynamic padding
 */
export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  // Detect game routes (e.g., /games/ludo/play, /games/chess/play)
  const isGameRoute = location.pathname.startsWith('/games/') && location.pathname !== '/games';

  return (
    <div
      className={cn(
        "min-h-screen bg-background flex flex-col",
        // Game mode: use svh for full mobile viewport
        isGameRoute && "min-h-[100svh]"
      )}
    >
      {/* Navbar - handles its own visibility based on route */}
      <Navbar />

      <main
        className={cn(
          "flex-1",
          // Game mode: no padding, full immersion
          isGameRoute && "p-0"
        )}
        style={!isGameRoute ? {
          // STEP 2: Dynamic padding using CSS variable + safe-area
          // --navbar-height is set by Navbar's ResizeObserver
          // env(safe-area-inset-top) handles iOS notch / Android status bar
          paddingTop: 'calc(var(--navbar-height, 80px) + env(safe-area-inset-top, 0px) + 16px)',
          paddingBottom: '2rem',
        } : undefined}
      >
        {children}
      </main>

      {/* Footer - only on non-game routes */}
      {!isGameRoute && (
        <footer
          className="border-t border-border bg-muted/30 py-4 sm:py-6"
          style={{
            // Safe-area for bottom (home indicator on iPhone X+)
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))'
          }}
        >
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
              <span className="text-muted-foreground">© {new Date().getFullYear()}</span>
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="font-medium text-foreground">Sunny Shah</span>
              <span className="text-muted-foreground hidden min-[400px]:inline">— All rights reserved.</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <a href="mailto:sunny93wo@gmail.com" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Email</span>
              </a>
              <a href="https://www.instagram.com/sunny.shah22" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
              <a href="https://www.linkedin.com/in/sunny2k2p23" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
