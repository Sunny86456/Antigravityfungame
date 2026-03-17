import { useNavigate } from 'react-router-dom';
import { Play, Users, User, Brain, Puzzle, BookOpen, Code } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  featured?: boolean;
  playable?: boolean;
  route?: string;
  action?: 'OPEN_LUDO_MODAL';
}

const tagIcons: Record<string, React.ReactNode> = {
  'Multiplayer': <Users className="w-3 h-3" />,
  'Single Player': <User className="w-3 h-3" />,
  'Strategy': <Brain className="w-3 h-3" />,
  'Puzzle': <Puzzle className="w-3 h-3" />,
  'Word': <BookOpen className="w-3 h-3" />,
  'Coding': <Code className="w-3 h-3" />,
  'AI': <Brain className="w-3 h-3" />,
  'Classic': <Puzzle className="w-3 h-3" />,
  'Educational': <BookOpen className="w-3 h-3" />,
  'Programming': <Code className="w-3 h-3" />,
  'DSA': <Code className="w-3 h-3" />,
  'Family': <Users className="w-3 h-3" />,
  'Logic': <Brain className="w-3 h-3" />,
  'Brain': <Brain className="w-3 h-3" />,
  'Casual': <User className="w-3 h-3" />,
  'Memory': <Brain className="w-3 h-3" />,
};

export function GameCard({ title, description, icon, tags, featured, playable, route, action }: GameCardProps) {
  const navigate = useNavigate();

  const handlePlay = () => {
    if (playable) {
      if (action === 'OPEN_LUDO_MODAL') {
        window.dispatchEvent(new CustomEvent('OPEN_LUDO_MODAL'));
        return;
      }
      if (route) {
        navigate(route);
      }
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl overflow-hidden",
        "glass-card dark:bg-white/5 dark:backdrop-blur-xl",
        "dark:border-white/10",
        "card-lift glow-card hover:glow-card-hover",
        featured && "md:col-span-2 md:row-span-2"
      )}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-radial" />
      </div>

      {/* Content */}
      <div className={cn(
        "relative p-6 flex flex-col h-full",
        featured ? "min-h-[300px]" : "min-h-[220px]"
      )}>
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4",
          "group-hover:scale-110 group-hover:rotate-3 transition-all duration-300",
          "glow-primary"
        )}>
          {icon}
        </div>

        {/* Title & Description */}
        <h3 className={cn(
          "font-bold text-card-foreground mb-2 neon-text",
          featured ? "text-2xl" : "text-xl"
        )}>
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 flex-grow">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span key={tag} className="game-tag flex items-center gap-1">
              {tagIcons[tag] || null}
              {tag}
            </span>
          ))}
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlay}
          disabled={!playable}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-3 rounded-xl",
            "transition-all duration-300",
            playable
              ? "gradient-primary text-primary-foreground hover:opacity-90 glow-primary cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
          )}
        >
          <Play className="w-5 h-5" />
          <span className="font-semibold">{playable ? 'Play Now' : 'Coming Soon'}</span>
        </button>
      </div>

      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold">
          Featured
        </div>
      )}

      {/* Playable Badge */}
      {playable && !featured && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-success text-primary-foreground text-xs font-bold">
          Playable
        </div>
      )}
    </div>
  );
}
