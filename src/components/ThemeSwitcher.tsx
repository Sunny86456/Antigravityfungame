import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const themes = [
  { id: 'light' as const, icon: Sun, label: 'Light' },
  { id: 'dark' as const, icon: Moon, label: 'Dark' },
  { id: 'neon' as const, icon: Sparkles, label: 'Neon' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-muted/50 border border-border">
      {themes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={cn(
            "relative p-2 rounded-full transition-all duration-300",
            theme === id 
              ? "bg-primary text-primary-foreground glow-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title={label}
        >
          <Icon className="w-4 h-4" />
          {theme === id && (
            <span className="absolute inset-0 rounded-full animate-ping bg-primary/30 pointer-events-none" />
          )}
        </button>
      ))}
    </div>
  );
}
