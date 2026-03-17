import { Piece } from './chessLogic';
import { cn } from '@/shared/lib/utils';

interface ChessPieceProps {
  piece: Piece;
  size?: number;
  isAnimating?: boolean;
}

export function ChessPiece({ piece, size = 40, isAnimating = false }: ChessPieceProps) {
  const { type, color } = piece;
  
  // High-quality Unicode chess pieces with enhanced 3D styling
  const pieceSymbols: Record<string, string> = {
    'white-king': '♔',
    'white-queen': '♕',
    'white-rook': '♖',
    'white-bishop': '♗',
    'white-knight': '♘',
    'white-pawn': '♙',
    'black-king': '♚',
    'black-queen': '♛',
    'black-rook': '♜',
    'black-bishop': '♝',
    'black-knight': '♞',
    'black-pawn': '♟'
  };
  
  const symbol = pieceSymbols[`${color}-${type}`];
  
  // 3D-like gradient and shadow effects
  const pieceStyles = color === 'white' 
    ? {
        // White pieces with ivory/pearl effect
        background: 'linear-gradient(145deg, #FFFFF0 0%, #E8E8D0 50%, #D4D4B8 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        textShadow: `
          1px 1px 0 #B8B8A0,
          2px 2px 0 #A0A088,
          3px 3px 2px rgba(0,0,0,0.3),
          0 0 10px rgba(255,255,240,0.5)
        `,
        filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.5))'
      }
    : {
        // Black pieces with obsidian/metallic effect
        background: 'linear-gradient(145deg, #4A4A4A 0%, #2D2D2D 50%, #1A1A1A 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        textShadow: `
          1px 1px 0 #666,
          -1px -1px 0 #000,
          2px 2px 3px rgba(0,0,0,0.5),
          0 0 8px rgba(100,100,100,0.3)
        `,
        filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.6))'
      };
  
  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none",
        isAnimating && "animate-piece-move"
      )}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Piece shadow layer */}
      <span
        className="absolute opacity-30 blur-[1px]"
        style={{
          fontSize: size * 0.95,
          lineHeight: 1,
          color: '#000',
          transform: 'translate(2px, 2px)',
        }}
      >
        {symbol}
      </span>
      
      {/* Main piece with 3D effect */}
      <span 
        className={cn(
          "relative z-10 transition-transform duration-200",
          "hover:scale-110"
        )}
        style={{ 
          fontSize: size * 0.95,
          lineHeight: 1,
          ...pieceStyles,
        }}
      >
        {symbol}
      </span>
      
      {/* Highlight glow for better visibility */}
      <span
        className="absolute opacity-20"
        style={{
          fontSize: size * 0.95,
          lineHeight: 1,
          color: color === 'white' ? '#FFFFF0' : '#666',
          filter: 'blur(3px)',
        }}
      >
        {symbol}
      </span>
    </div>
  );
}
