import { Link, useLocation } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { Gamepad2, Home, LayoutGrid, Trophy, User, Settings, Coins, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const navLinks = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/games', icon: LayoutGrid, label: 'Games' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Navbar() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Hide if scrolling down and not at top
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setIsVisible(false);
        } else {
          // Show if scrolling up or at top
          setIsVisible(true);
        }
        
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  return (
    <nav 
      className={cn(
        "fixed z-50 transition-all duration-500 ease-in-out",
        "left-1/2 -translate-x-1/2", // Center horizontally
        "bg-background/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/5", // Glassmorphism & Shadow
        "rounded-[2rem]", // Capsule shape (high radius)
        isVisible ? "top-4 opacity-100 translate-y-0" : "-top-32 opacity-0 -translate-y-full", // Hide/Show animation
        "w-[95%] max-w-4xl" // Compact width
      )}
    >
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl gradient-primary glow-primary group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text neon-text">FunGameForYou</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                  location.pathname === to
                    ? "bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Coins Display */}
            <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Coins className="w-4 h-4 text-coin coin-shimmer" />
              <span className="font-bold text-sm text-foreground">
                {profile?.coins?.toLocaleString() ?? '0'}
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
