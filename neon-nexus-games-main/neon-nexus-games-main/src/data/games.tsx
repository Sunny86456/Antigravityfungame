import { Crown, Gamepad2, Puzzle, BookOpen, Brain, Code2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// TEMPORARY: Disable Ludo game for deployment
const ENABLE_LUDO = false;

export interface Game {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tags: string[];
  featured?: boolean;
  playable: boolean;
  route?: string;
}

export const games: Game[] = [
  {
    id: 'chess',
    title: 'Chess',
    description: 'Classic strategy game with AI opponent and board customization',
    icon: Crown,
    tags: ['Strategy', 'AI', 'Classic'],
    featured: true,
    playable: true,
    route: '/games/chess'
  },
  {
    id: 'coding-game',
    title: 'DSA Coding Challenge',
    description: 'Complete coding challenges and master algorithms level by level',
    icon: Code2,
    tags: ['Educational', 'Programming'],
    featured: true,
    playable: true,
    route: '/games/coding'
  },
  ...(ENABLE_LUDO ? [{
    id: 'ludo',
    title: 'Ludo',
    description: 'Roll the dice and race your tokens to victory! A fun family board game.',
    icon: Gamepad2,
    tags: ['Multiplayer', 'Strategy', 'AI'], // Added AI tag
    playable: true,
    route: '/games/ludo'
  }] : []),
  {
    id: 'puzzle',
    title: 'Puzzle',
    description: 'Test your problem-solving skills with challenging puzzles.',
    icon: Puzzle,
    tags: ['Single Player', 'Puzzle'],
    playable: false
  },
  {
    id: 'word-game',
    title: 'Word Game',
    description: 'Expand your vocabulary with exciting word challenges.',
    icon: BookOpen,
    tags: ['Single Player', 'Educational'],
    playable: false
  },
  {
    id: 'memory-game',
    title: 'Memory Game',
    description: 'Train your brain with memory matching challenges.',
    icon: Brain,
    tags: ['Single Player', 'Puzzle'],
    playable: false
  },
];

export const featuredGames = games.filter(g => g.featured);
export const allGames = games;
