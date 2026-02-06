export interface BoardTheme {
  id: string;
  name: string;
  lightSquare: string;
  darkSquare: string;
  price: number;
  isDefault?: boolean;
  preview: string;
  tier?: 'common' | 'rare' | 'legendary';
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    lightSquare: '#1a1a1a',
    darkSquare: '#0d0d0d',
    price: 0,
    isDefault: true,
    preview: 'Classic black and gray board'
  },
  {
    id: 'wood',
    name: 'Wooden',
    lightSquare: '#DEB887',
    darkSquare: '#8B4513',
    price: 50,
    preview: 'Traditional wooden board'
  },
  {
    id: 'marble',
    name: 'Marble',
    lightSquare: '#E8E8E8',
    darkSquare: '#3A3A3A',
    price: 75,
    preview: 'Elegant marble finish'
  },
  {
    id: 'forest',
    name: 'Forest',
    lightSquare: '#90EE90',
    darkSquare: '#228B22',
    price: 100,
    preview: 'Natural green tones'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    lightSquare: '#87CEEB',
    darkSquare: '#006994',
    price: 100,
    preview: 'Deep blue ocean theme'
  },
  {
    id: 'royal',
    name: 'Royal Purple',
    lightSquare: '#E6E6FA',
    darkSquare: '#663399',
    price: 150,
    preview: 'Majestic purple theme'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    lightSquare: '#FFD700',
    darkSquare: '#FF4500',
    price: 150,
    preview: 'Warm sunset colors'
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    lightSquare: '#00FF00',
    darkSquare: '#8B00FF',
    price: 200,
    preview: 'Cyberpunk neon style'
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    lightSquare: '#1E0533',
    darkSquare: '#0B0014',
    price: 250,
    preview: 'Deep space theme'
  },
  {
    id: 'gold',
    name: 'Golden Elite',
    lightSquare: '#FFD700',
    darkSquare: '#B8860B',
    price: 300,
    preview: 'Premium golden finish'
  },
  // Legendary Tier Boards
  {
    id: 'volcanic',
    name: 'Volcanic Ember',
    lightSquare: '#FF6B35',
    darkSquare: '#1A0A00',
    price: 700,
    preview: 'Fiery volcanic glow with molten accents',
    tier: 'legendary'
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    lightSquare: '#88D8B0',
    darkSquare: '#0D2137',
    price: 800,
    preview: 'Northern lights shimmer effect',
    tier: 'legendary'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Night',
    lightSquare: '#2D2D3A',
    darkSquare: '#0A0A0F',
    price: 850,
    preview: 'Deep black with subtle purple undertones',
    tier: 'legendary'
  },
  {
    id: 'diamond',
    name: 'Diamond Crystal',
    lightSquare: '#E8F4F8',
    darkSquare: '#1A3A4A',
    price: 900,
    preview: 'Brilliant crystalline finish',
    tier: 'legendary'
  },
  {
    id: 'cosmic',
    name: 'Cosmic Void',
    lightSquare: '#4B0082',
    darkSquare: '#0D001A',
    price: 1000,
    preview: 'Ultimate deep space with stardust',
    tier: 'legendary'
  }
];

export const getThemeById = (id: string): BoardTheme => {
  return BOARD_THEMES.find(t => t.id === id) || BOARD_THEMES[0];
};
