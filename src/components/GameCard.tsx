import { useNavigate } from 'react-router-dom';
import { Play, Users, User, Brain, Puzzle, BookOpen, Code } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useRef, useCallback } from 'react';

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
  const cardRef = useRef<HTMLDivElement>(null);

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

  // ── Mouse-follow tilt + inner glow ─────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Tilt: max 4 degrees
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.01)`;
    // Inner glow position
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative rounded-2xl overflow-hidden",
        "glass-card card-glow-inner",
        "transition-[box-shadow,border-color] duration-300",
        "glow-card hover:glow-card-hover",
        featured && "md:col-span-2 md:row-span-2"
      )}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.2s ease-out, box-shadow 0.3s ease' }}
    >
      {/* Content */}
      <div className={cn(
        "relative p-6 flex flex-col h-full z-[2]",
        featured ? "min-h-[300px]" : "min-h-[220px]"
      )}>
        {/* Icon */}
        <div className={cn(
          "w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4",
          "group-hover:scale-110 group-hover:rotate-3 transition-all duration-300",
          "glow-primary"
        )}>
          {icon}
        </div>

        {/* Title & Description */}
        <h3 className={cn(
          "font-bold text-card-foreground mb-2",
          featured ? "text-2xl" : "text-xl"
        )}>
          {title}
        </h3>
        <p className="text-muted-strong text-sm mb-4 flex-grow leading-relaxed">
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
            "transition-all duration-300 font-semibold",
            playable
              ? "gradient-primary text-primary-foreground hover:opacity-90 glow-primary cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              : "glass-button-disabled cursor-not-allowed"
          )}
        >
          <Play className="w-5 h-5" />
          <span>{playable ? 'Play Now' : 'Coming Soon'}</span>
        </button>
      </div>

      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4 z-[3] px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-bold badge-glow">
          ✨ Featured
        </div>
      )}

      {/* Playable Badge */}
      {playable && !featured && (
        <div className="absolute top-4 right-4 z-[3] px-3 py-1 rounded-full border border-accent/25 bg-accent/85 text-accent-foreground text-xs font-bold backdrop-blur-md shadow-[0_0_20px_hsl(var(--glow-accent)/0.22)]">
          Playable
        </div>
      )}
    </div>
  );
}
