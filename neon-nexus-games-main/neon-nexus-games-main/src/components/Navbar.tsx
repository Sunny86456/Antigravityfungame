import { Link, useLocation } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2, Home, LayoutGrid, Trophy, User, Settings, Coins, LogIn, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const navLinks = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/games', icon: LayoutGrid, label: 'Games' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' }, // New Shop Link
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Navbar() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  const isGameRoute = location.pathname.startsWith('/games/') && location.pathname !== '/games';

  useEffect(() => {
    // Force hide on game routes immediately
    if (isGameRoute) {
      setIsVisible(false);
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Strict logic: Visible only at absolute top (0)
          const atTop = window.scrollY === 0;
          setIsVisible(atTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Initial check triggers visibility correctly on route change or reload
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, isGameRoute]);

  // If on a game route, we render nothing to prevent any DOM presence/immersion breaking
  // The requirement says "Force-hide", returning null is the most performant and correct way.
  if (isGameRoute) return null;

  return (
    <nav
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out", // Updated duration for snappier feel
        "left-1/2 -translate-x-1/2",
        "bg-background/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/5",
        "rounded-[2rem]",
        // Strict visibility classes
        isVisible ? "top-4 opacity-100 translate-y-0" : "-top-20 opacity-0 -translate-y-8",
        "w-[98%] max-w-[1500px]" // Maximized width for premium feel
      )}
    >
      <div className="px-6 md:px-12">
        <div className="flex items-center justify-between h-20"> {/* Increased Height slightly for breathing room */}
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl gradient-primary glow-primary group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text neon-text">FunGameForYou</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-10"> {/* Large gaps */}
            {navLinks.map(({ to, icon: Icon, label }) => {
              const isShop = to === '/shop';
              return (
                <Link
                  key={to}
                  to={isShop ? '#' : to}
                  className={cn(
                    "flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 relative group", // More internal padding
                    location.pathname === to
                      ? "bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                    isShop && "opacity-70 hover:opacity-100"
                  )}
                  onClick={(e) => isShop && e.preventDefault()}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>

                  {/* Shop "Coming Soon" Badge */}
                  {isShop && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-primary text-[8px] font-bold text-primary-foreground rounded-full shadow-sm animate-pulse">
                      SOON
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section - Grouping Coins & Profile */}
          <div className="flex items-center gap-5 lg:gap-8"> {/* Increased spacing */}
            {/* Coins Display - ALWAYS VISIBLE if Navbar is visible */}
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-default min-w-[100px] justify-center">
              <Coins className="w-4 h-4 text-amber-500 coin-shimmer" />
              <span className="font-bold text-sm text-amber-500">
                {profile?.coins?.toLocaleString() ?? '100'}
              </span>
            </div>

            <ThemeSwitcher />

            {/* User Avatar / Login */}
            {user ? (
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center cursor-pointer hover:scale-105 transition-transform ring-2 ring-white/10"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary-foreground" />
                )}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 rounded-full gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-between py-3 border-t border-white/10">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                location.pathname === to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
