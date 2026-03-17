import { useState, useEffect, useRef } from 'react';
import { ChessPiece } from '../ChessPiece';
import { BoardTheme, getThemeById } from '../themes';
import { Board, Position, Move, PieceType, PieceColor } from '../chessLogic';
import { cn } from '@/lib/utils';

interface LastMoveHighlight {
  from: Position;
  to: Position;
}

interface ChessBoardProps {
  board: Board;
  theme?: BoardTheme | string;
  selectedSquare?: Position | null;
  legalMoves?: Move[];
  onSquareClick?: (row: number, col: number) => void;
  highlightSquares?: Position[];
  targetSquare?: Position;
  showArrow?: { from: Position; to: Position };
  lastMove?: LastMoveHighlight | null;
  disabled?: boolean;
  animatingPiece?: {
    from: Position;
    to: Position;
    piece: { type: PieceType; color: PieceColor };
  } | null;
  animationsEnabled?: boolean;
  showCoordinates?: boolean;
  /** For learning mode: squares that are blocked by pieces */
  blockedSquares?: Position[];
}

export function ChessBoard({
  board,
  theme = 'classic',
  selectedSquare,
  legalMoves = [],
  onSquareClick,
  highlightSquares = [],
  targetSquare,
  showArrow,
  lastMove,
  disabled = false,
  animatingPiece,
  animationsEnabled = true,
  showCoordinates = true,
  blockedSquares = [],
}: ChessBoardProps) {
  const [boardSize, setBoardSize] = useState(480);
  const boardRef = useRef<HTMLDivElement>(null);

  const currentTheme = typeof theme === 'string' ? getThemeById(theme) : theme;
  const squareSize = boardSize / 8;

  useEffect(() => {
    const calculateBoardSize = () => {
      const maxSize = Math.min(window.innerWidth * 0.85, 520);
      const size = Math.floor(maxSize / 8) * 8;
      setBoardSize(size);
    };

    calculateBoardSize();
    window.addEventListener('resize', calculateBoardSize);
    return () => window.removeEventListener('resize', calculateBoardSize);
  }, []);

  const isLastMoveSquare = (row: number, col: number) => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  const isBlockedSquare = (row: number, col: number) => {
    return blockedSquares.some(s => s.row === row && s.col === col);
  };

  // Render arrow SVG overlay
  const renderArrow = () => {
    if (!showArrow) return null;

    const fromX = showArrow.from.col * squareSize + squareSize / 2;
    const fromY = showArrow.from.row * squareSize + squareSize / 2;
    const toX = showArrow.to.col * squareSize + squareSize / 2;
    const toY = showArrow.to.row * squareSize + squareSize / 2;

    // Calculate angle and shorten the line to leave room for arrowhead
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    const arrowLength = 12;
    const shortenedLength = length - arrowLength;
    
    const endX = fromX + Math.cos(angle) * shortenedLength;
    const endY = fromY + Math.sin(angle) * shortenedLength;

    return (
      <svg
        className="absolute inset-0 pointer-events-none z-10"
        width={boardSize}
        height={boardSize}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="hsl(var(--primary))"
              opacity="0.8"
            />
          </marker>
        </defs>
        <line
          x1={fromX}
          y1={fromY}
          x2={endX}
          y2={endY}
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          opacity="0.7"
          markerEnd="url(#arrowhead)"
          strokeLinecap="round"
        />
        {/* Start circle */}
        <circle
          cx={fromX}
          cy={fromY}
          r="6"
          fill="hsl(var(--primary))"
          opacity="0.7"
        />
      </svg>
    );
  };

  return (
    <div
      ref={boardRef}
      className="relative flex-shrink-0"
      style={{ width: boardSize, height: boardSize }}
    >
      {/* Arrow overlay */}
      {renderArrow()}
      
      <div
        className="grid grid-cols-8 gap-0 rounded-xl overflow-hidden shadow-2xl"
        style={{ width: boardSize, height: boardSize }}
      >
        {board.map((row, rowIndex) =>
          row.map((square, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected =
              selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
            const isLegalMove = legalMoves.some(
              (m) => m.to.row === rowIndex && m.to.col === colIndex
            );
            const isCapture = isLegalMove && square !== null;
            const isHighlighted = highlightSquares?.some(
              (h) => h.row === rowIndex && h.col === colIndex
            );
            const isTarget =
              targetSquare?.row === rowIndex && targetSquare?.col === colIndex;
            const isLastMove = isLastMoveSquare(rowIndex, colIndex);
            const isBlocked = isBlockedSquare(rowIndex, colIndex);
            const isAnimating =
              animatingPiece &&
              animatingPiece.to.row === rowIndex &&
              animatingPiece.to.col === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => !disabled && onSquareClick?.(rowIndex, colIndex)}
                className={cn(
                  'flex items-center justify-center transition-all relative',
                  !disabled && 'cursor-pointer',
                  isSelected && 'ring-4 ring-primary ring-inset',
                  isHighlighted && 'ring-4 ring-coin ring-inset animate-pulse',
                  isTarget && 'ring-4 ring-success ring-inset animate-pulse'
                )}
                style={{
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: isLight
                    ? currentTheme.lightSquare
                    : currentTheme.darkSquare,
                }}
              >
                {/* Last move highlight - prominent visual feedback */}
                {isLastMove && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: lastMove?.to.row === rowIndex && lastMove?.to.col === colIndex
                        ? 'rgba(var(--primary-rgb, 139, 92, 246), 0.4)'
                        : 'rgba(var(--primary-rgb, 139, 92, 246), 0.25)',
                      boxShadow: 'inset 0 0 0 3px rgba(var(--primary-rgb, 139, 92, 246), 0.5)',
                      animation: 'lastMoveHighlight 2s ease-out forwards'
                    }}
                  />
                )}

                {/* Blocked square indicator (for learning mode) */}
                {isBlocked && (
                  <div 
                    className="absolute inset-0 pointer-events-none bg-destructive/20"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(239, 68, 68, 0.1) 5px, rgba(239, 68, 68, 0.1) 10px)'
                    }}
                  />
                )}

                {/* Legal move indicator */}
                {isLegalMove && !isCapture && (
                  <div
                    className="absolute rounded-full bg-primary/50 transition-transform hover:scale-110"
                    style={{
                      width: squareSize * 0.33,
                      height: squareSize * 0.33,
                    }}
                  />
                )}

                {/* Capture indicator */}
                {isCapture && (
                  <div
                    className="absolute rounded-full border-4 border-destructive/50"
                    style={{
                      width: squareSize - 8,
                      height: squareSize - 8,
                    }}
                  />
                )}

                {/* Piece */}
                {square && (
                  <div
                    className={cn(
                      'transition-all duration-200',
                      isAnimating && animationsEnabled && 'animate-scale-in'
                    )}
                  >
                    <ChessPiece
                      piece={square}
                      size={squareSize * 0.85}
                      isAnimating={isAnimating && animationsEnabled}
                    />
                  </div>
                )}

                {/* Coordinates */}
                {showCoordinates && colIndex === 0 && (
                  <span
                    className="absolute top-0.5 left-1 text-xs font-bold opacity-50"
                    style={{
                      color: isLight
                        ? currentTheme.darkSquare
                        : currentTheme.lightSquare,
                    }}
                  >
                    {8 - rowIndex}
                  </span>
                )}
                {showCoordinates && rowIndex === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 text-xs font-bold opacity-50"
                    style={{
                      color: isLight
                        ? currentTheme.darkSquare
                        : currentTheme.lightSquare,
                    }}
                  >
                    {'abcdefgh'[colIndex]}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
