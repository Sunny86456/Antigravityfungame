import { Link, useLocation } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2, Home, LayoutGrid, Trophy, User, Settings, Coins, LogIn, ShoppingBag } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Z-INDEX SYSTEM
 * - Navbar: 100
 * - Modals: 1000
 * - Toasts: 2000
 */
const Z_INDEX_NAVBAR = 100;

/**
 * CSS Variable name for navbar height
 * This is set dynamically via ResizeObserver
 */
const NAVBAR_HEIGHT_VAR = '--navbar-height';

const navLinks = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/games', icon: LayoutGrid, label: 'Games' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Navbar() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const navRef = useRef<HTMLElement>(null);

  // Game routes = any path under /games/* except /games itself
  const isGameRoute = location.pathname.startsWith('/games/') && location.pathname !== '/games';

  /**
   * STEP 1: ResizeObserver for dynamic navbar height
   * Updates CSS variable whenever navbar size changes
   */
  const updateNavbarHeight = useCallback(() => {
    if (navRef.current) {
      const height = navRef.current.getBoundingClientRect().height;
      // Add 16px padding (top-4 = 1rem = 16px)
      const totalHeight = height + 16;
      document.documentElement.style.setProperty(NAVBAR_HEIGHT_VAR, `${totalHeight}px`);
    }
  }, []);

  useEffect(() => {
    // Skip measurement on game routes
    if (isGameRoute) {
      document.documentElement.style.setProperty(NAVBAR_HEIGHT_VAR, '0px');
      return;
    }

    const navElement = navRef.current;
    if (!navElement) return;

    // Initial measurement
    updateNavbarHeight();

    // ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver(() => {
      updateNavbarHeight();
    });
    resizeObserver.observe(navElement);

    // Also update on orientation change
    const handleOrientationChange = () => {
      setTimeout(updateNavbarHeight, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, [isGameRoute, updateNavbarHeight]);

  // Scroll visibility logic
  useEffect(() => {
    if (isGameRoute) {
      setIsVisible(false);
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const atTop = window.scrollY === 0;
          setIsVisible(atTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, isGameRoute]);

  // CRITICAL: Return null on game routes
  if (isGameRoute) return null;

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed transition-all duration-300 ease-out",
        // Centered with safe-area consideration
        "left-1/2 -translate-x-1/2",
        // Glassmorphism - light theme uses glass-navbar, dark/neon keeps existing
        "glass-navbar dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-lg dark:shadow-black/10",
        // Capsule shape - smaller radius on very small screens
        "rounded-[1.5rem] sm:rounded-[2rem]",
        // Visibility with pointer-events safety
        isVisible
          ? "top-[max(0.75rem,env(safe-area-inset-top))] opacity-100 translate-y-0 pointer-events-auto"
          : "-top-24 opacity-0 -translate-y-8 pointer-events-none",
        // Width - full on mobile
        "w-[96%] sm:w-[98%] max-w-[1400px]"
      )}
      style={{ zIndex: Z_INDEX_NAVBAR }}
    >
      {/* Main navbar row - NEVER wraps */}
      <div
        className={cn(
          "flex items-center justify-between",
          // Reduced padding on mobile, more on desktop
          "px-3 sm:px-5 md:px-8",
          // Reduced height on short screens
          "h-12 min-[400px]:h-14 sm:h-16 md:h-18",
          // Prevent wrapping
          "flex-nowrap"
        )}
      >
        {/* Logo - compact on mobile */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0">
          <div className="p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl gradient-primary glow-primary group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-foreground" />
          </div>
          <span className="text-sm sm:text-base md:text-lg font-bold gradient-text neon-text hidden min-[360px]:inline truncate max-w-[100px] sm:max-w-none">
            FunGameForYou
          </span>
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-4">
          {navLinks.map(({ to, icon: Icon, label }) => {
            const isShop = to === '/shop';
            return (
              <Link
                key={to}
                to={isShop ? '#' : to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 relative",
                  location.pathname === to
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  isShop && "opacity-60"
                )}
                onClick={(e) => isShop && e.preventDefault()}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
                {isShop && (
                  <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 bg-primary text-[7px] font-bold text-primary-foreground rounded-full">
                    SOON
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Section - Always visible, compact on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Coins - compact on mobile */}
          <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
            <span className="font-bold text-[10px] sm:text-xs text-amber-500">
              {profile?.coins?.toLocaleString() ?? '100'}
            </span>
          </div>

          {/* Theme toggle - hidden on very small screens */}
          <div className="hidden min-[400px]:block">
            <ThemeSwitcher />
          </div>

          {/* User Avatar / Login - compact */}
          {user ? (
            <Link
              to="/profile"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full gradient-primary flex items-center justify-center hover:scale-105 transition-transform ring-1 ring-white/10"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
              )}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full gradient-primary text-primary-foreground font-medium text-xs sm:text-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation Row - Horizontal scroll if needed */}
      <div
        className={cn(
          "flex lg:hidden items-center justify-around",
          // Compact padding
          "py-1.5 sm:py-2",
          "border-t border-white/10",
          // Horizontal scroll on overflow
          "overflow-x-auto scrollbar-hide",
          // Prevent wrap
          "flex-nowrap",
          // Reduce margin from main content
          "-mx-1 px-1"
        )}
      >
        {navLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1 rounded-lg transition-all flex-shrink-0",
              location.pathname === to
                ? "text-primary bg-primary/10"
                : "text-muted-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[8px] sm:text-[9px] font-medium whitespace-nowrap">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
