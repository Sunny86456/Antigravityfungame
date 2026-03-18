import { Link, useLocation } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2, Home, LayoutGrid, Trophy, User, Settings, Coins, LogIn, ShoppingBag } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';

/**
 * Z-INDEX SYSTEM
 * - Navbar: 100
 * - Modals: 1000
 * - Toasts: 2000
 */
const Z_INDEX_NAVBAR = 100;
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

  // ── Sliding active indicator state ─────────────────────────
  const navLinksContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const isGameRoute = location.pathname.startsWith('/games/') && location.pathname !== '/games';

  // ── Measure active link and update indicator ───────────────
  const updateIndicator = useCallback(() => {
    if (!navLinksContainerRef.current) return;
    const container = navLinksContainerRef.current;
    const activeLink = container.querySelector('[data-active="true"]') as HTMLElement;
    if (activeLink) {
      const containerRect = container.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setIndicatorStyle({
        left: linkRect.left - containerRect.left,
        width: linkRect.width,
        opacity: 1,
      });
    } else {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, []);

  useLayoutEffect(() => {
    updateIndicator();
  }, [location.pathname, updateIndicator]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  // ── Navbar height for layout padding ───────────────────────
  const updateNavbarHeight = useCallback(() => {
    if (navRef.current) {
      const height = navRef.current.getBoundingClientRect().height;
      const totalHeight = height + 16;
      document.documentElement.style.setProperty(NAVBAR_HEIGHT_VAR, `${totalHeight}px`);
    }
  }, []);

  useEffect(() => {
    if (isGameRoute) {
      document.documentElement.style.setProperty(NAVBAR_HEIGHT_VAR, '0px');
      return;
    }
    const navElement = navRef.current;
    if (!navElement) return;
    updateNavbarHeight();
    const resizeObserver = new ResizeObserver(updateNavbarHeight);
    resizeObserver.observe(navElement);
    window.addEventListener('resize', updateNavbarHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, [isGameRoute, updateNavbarHeight]);

  // ── Scroll-based visibility ────────────────────────────────
  useEffect(() => {
    if (isGameRoute) { setIsVisible(false); return; }
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY === 0);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, isGameRoute]);

  if (isGameRoute) return null;

  return (
    <nav
      ref={navRef}
      className={cn(
        "fixed transition-all duration-300 ease-out",
        "left-1/2 -translate-x-1/2",
        "glass-navbar",
        "rounded-[1.5rem] sm:rounded-[2rem]",
        isVisible
          ? "top-[max(0.75rem,env(safe-area-inset-top))] opacity-100 translate-y-0 pointer-events-auto"
          : "-top-24 opacity-0 -translate-y-8 pointer-events-none",
        "w-[96%] sm:w-[98%] max-w-[1400px]"
      )}
      style={{ zIndex: Z_INDEX_NAVBAR }}
    >
      {/* Bottom light edge */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-px gradient-line" />

      {/* Main navbar row */}
      <div
        className={cn(
          "flex items-center justify-between",
          "px-3 sm:px-5 md:px-8",
          "h-12 min-[400px]:h-14 sm:h-16 md:h-18",
          "flex-nowrap"
        )}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0">
          <div className="p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl gradient-primary glow-primary group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-foreground" />
          </div>
          <span className="text-sm sm:text-base md:text-lg font-bold gradient-text neon-text hidden min-[360px]:inline truncate max-w-[100px] sm:max-w-none">
            FunGameForYou
          </span>
        </Link>

        {/* ── Desktop Navigation with sliding indicator ──────── */}
        <div ref={navLinksContainerRef} className="hidden lg:flex items-center gap-1 xl:gap-2 relative">
          {/* Animated indicator pill */}
          <div
            className="nav-indicator absolute top-1/2 -translate-y-1/2 h-9"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              opacity: indicatorStyle.opacity,
            }}
          />
          {navLinks.map(({ to, icon: Icon, label }) => {
            const isShop = to === '/shop';
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={isShop ? '#' : to}
                data-active={isActive}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 z-[1]",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-strong hover:text-foreground hover:bg-primary/8",
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

        {/* ── Right Section ──────────────────────────────────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Coins */}
          <div className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full glass-surface-1 border border-amber-500/25">
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 coin-shimmer" />
            <span className="font-bold text-[10px] sm:text-xs text-amber-500 stat-number">
              {profile?.coins?.toLocaleString() ?? '100'}
            </span>
          </div>

          {/* Theme toggle */}
          <div className="hidden min-[400px]:block">
            <ThemeSwitcher />
          </div>

          {/* User Avatar / Login */}
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
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full gradient-primary text-primary-foreground font-medium text-xs sm:text-sm glow-primary hover:scale-105 transition-transform"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Mobile Navigation ────────────────────────────────── */}
      <div
        className={cn(
          "flex lg:hidden items-center justify-around",
          "py-1.5 sm:py-2",
          "border-t border-border/50",
          "overflow-x-auto scrollbar-hide",
          "flex-nowrap",
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
                : "text-muted-strong"
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
