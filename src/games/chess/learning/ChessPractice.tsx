import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSounds } from '@/shared/hooks/useGameSounds';
import { ChessPiece } from '../ChessPiece';
import { ChessBoard } from '../components/ChessBoard';
import { BOARD_THEMES, BoardTheme, getThemeById } from '../themes';
import {
  Board,
  Position,
  Move,
  PieceColor,
  PieceType,
  createInitialBoard,
  getLegalMoves,
  makeMove,
  getGameState,
  isInCheck,
  getAIMove,
  getMoveNotation
} from '../chessLogic';
import {
  ChevronLeft,
  RotateCcw,
  Cpu,
  Clock,
  Loader2,
  Settings,
  Trophy,
  AlertTriangle,
  Play
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameMode = 'settings' | 'playing';

interface AnimatingPiece {
  from: Position;
  to: Position;
  piece: { type: PieceType; color: PieceColor };
}

export default function ChessPractice() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { playSound } = useGameSounds();
  
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('settings');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('white');
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [enPassantTarget, setEnPassantTarget] = useState<Position | undefined>();
  const [gameResult, setGameResult] = useState<'playing' | 'checkmate' | 'stalemate' | 'draw'>('playing');
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{ from: Position; to: Position } | null>(null);
  
  // Animation state
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  
  // Theme
  const [selectedTheme] = useState<string>('classic');
  
  // Timer
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  
  // Board size
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(480);
  
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
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameMode === 'playing' && gameResult === 'playing') {
      interval = setInterval(() => {
        setGameTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [gameMode, gameResult, gameStartTime]);
  
  // Execute a move with animation
  const executeMove = useCallback((move: Move, boardState: Board, turn: PieceColor) => {
    if (move.captured) {
      playSound('capture');
    } else {
      playSound('move');
    }
    
    if (animationsEnabled) {
      setAnimatingPiece({
        from: move.from,
        to: move.to,
        piece: move.piece
      });
      
      setTimeout(() => {
        setAnimatingPiece(null);
      }, 200);
    }
    
    const newBoard = makeMove(boardState, move);
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, move]);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove({ from: move.from, to: move.to }); // Track last move for highlighting
    
    const newEnPassant = move.piece.type === 'pawn' && Math.abs(move.from.row - move.to.row) === 2
      ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
      : undefined;
    setEnPassantTarget(newEnPassant);
    
    const nextColor = turn === 'white' ? 'black' : 'white';
    const state = getGameState(newBoard, nextColor, newEnPassant);
    
    if (isInCheck(newBoard, nextColor)) {
      playSound('check');
    }
    
    if (state === 'checkmate') {
      setGameResult('checkmate');
      setWinner(turn);
    } else if (state === 'stalemate') {
      setGameResult('stalemate');
    } else {
      setCurrentTurn(nextColor);
    }
  }, [animationsEnabled, playSound]);
  
  // AI move effect
  useEffect(() => {
    if (gameMode !== 'playing') return;
    if (gameResult !== 'playing') return;
    if (currentTurn !== 'black') return;
    
    setIsAIThinking(true);
    
    const timeout = setTimeout(() => {
      const aiMove = getAIMove(board, 'black', difficulty, enPassantTarget);
      
      if (aiMove) {
        executeMove(aiMove, board, currentTurn);
      }
      
      setIsAIThinking(false);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [currentTurn, gameMode, gameResult, board, difficulty, enPassantTarget, executeMove]);
  
  const startGame = () => {
    playSound('click');
    setBoard(createInitialBoard());
    setCurrentTurn('white');
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveHistory([]);
    setEnPassantTarget(undefined);
    setGameResult('playing');
    setWinner(null);
    setPromotionPending(null);
    setAnimatingPiece(null);
    setLastMove(null);
    setGameStartTime(Date.now());
    setGameTime(0);
    setGameMode('playing');
  };
  
  const handleSquareClick = (row: number, col: number) => {
    if (gameResult !== 'playing') return;
    if (isAIThinking) return;
    if (promotionPending) return;
    if (animatingPiece) return;
    if (currentTurn === 'black') return;
    
    const clickedPiece = board[row][col];
    
    if (selectedSquare) {
      const move = legalMoves.find(m => m.to.row === row && m.to.col === col);
      
      if (move) {
        if (move.piece.type === 'pawn' && (row === 0 || row === 7)) {
          setPromotionPending({ from: move.from, to: move.to });
          return;
        }
        
        executeMove(move, board, currentTurn);
        return;
      }
    }
    
    if (clickedPiece && clickedPiece.color === currentTurn) {
      playSound('click');
      setSelectedSquare({ row, col });
      const moves = getLegalMoves(board, currentTurn, enPassantTarget)
        .filter(m => m.from.row === row && m.from.col === col);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };
  
  const handlePromotion = (pieceType: PieceType) => {
    if (!promotionPending || !selectedSquare) return;
    
    const move = legalMoves.find(
      m => m.to.row === promotionPending.to.row && 
           m.to.col === promotionPending.to.col &&
           m.promotion === pieceType
    );
    
    if (move) {
      executeMove(move, board, currentTurn);
    }
    
    setPromotionPending(null);
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const currentTheme = getThemeById(selectedTheme);
  const squareSize = boardSize / 8;
  
  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-strong mb-6">Please sign in to access practice mode.</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-all"
          >
            Sign In
          </button>
        </div>
      </Layout>
    );
  }
  
  // Settings screen
  if (gameMode === 'settings') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <button
            onClick={() => navigate('/games/chess/learn')}
            className="flex items-center gap-2 mb-8 text-muted-strong hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Learning Hub
          </button>
          
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-warning mb-1">Practice Mode</h3>
                <p className="text-sm text-warning/80">
                  This mode does NOT affect your stats, coins, or leaderboard position. 
                  Perfect for learning without pressure!
                </p>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Select Difficulty</h2>
          
          <div className="space-y-4">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "w-full p-6 rounded-2xl border-2 transition-all text-left",
                  difficulty === d
                    ? "border-primary glass-surface-2 glow-card"
                    : "border-border glass-surface-1 hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground capitalize">{d}</h3>
                    <p className="text-sm text-muted-strong">
                      {d === 'easy' && 'Perfect for beginners'}
                      {d === 'medium' && 'Balanced challenge'}
                      {d === 'hard' && 'For experienced players'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <button
            onClick={startGame}
            className="w-full mt-8 py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all glow-primary flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Practice
          </button>
        </div>
      </Layout>
    );
  }
  
  // Game Board
  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setGameMode('settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-button-secondary transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Exit
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-chip">
              <Clock className="w-5 h-5" />
              {formatTime(gameTime)}
            </div>
            
            <div className="px-3 py-1.5 rounded-lg bg-warning/20 text-warning text-sm font-medium">
              Practice Mode
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAIThinking && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                AI thinking...
              </div>
            )}
            
            {isInCheck(board, currentTurn) && gameResult === 'playing' && (
              <div className="px-4 py-2 rounded-xl bg-destructive/20 text-destructive font-bold animate-pulse">
                Check!
              </div>
            )}
          </div>
          
          <button
            onClick={startGame}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-button-secondary transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Chess Board - Using reusable component */}
          <div className="relative">
            <ChessBoard
              board={board}
              theme={selectedTheme}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={handleSquareClick}
              lastMove={lastMove}
              disabled={gameResult !== 'playing' || isAIThinking}
              animatingPiece={animatingPiece}
              animationsEnabled={animationsEnabled}
            />
            
            {/* Promotion Dialog - positioned over the board */}
            {promotionPending && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl z-10">
                <div className="p-4 rounded-xl glass-surface-2">
                  <p className="text-sm font-medium text-foreground mb-3 text-center">Promote to:</p>
                  <div className="flex gap-2">
                    {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => handlePromotion(type)}
                        className="p-2 rounded-lg glass-button-secondary transition-all"
                      >
                        <ChessPiece piece={{ type, color: currentTurn }} size={40} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Game Over Overlay */}
            {gameResult !== 'playing' && (
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-xl animate-fade-in">
                <div className="text-center p-8">
                  <Trophy className={cn(
                    "w-16 h-16 mx-auto mb-4",
                    winner === 'white' ? "text-coin animate-bounce" : winner === 'black' ? "text-accent" : "text-muted-strong"
                  )} />
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {gameResult === 'checkmate' && `${winner === 'white' ? 'White' : 'Black'} Wins!`}
                    {gameResult === 'stalemate' && 'Stalemate!'}
                    {gameResult === 'draw' && 'Draw!'}
                  </h2>
                  <p className="text-muted-strong mb-2">
                    {gameResult === 'checkmate' && 'Checkmate!'}
                    {gameResult === 'stalemate' && 'No legal moves available'}
                    {gameResult === 'draw' && 'The game ended in a draw'}
                  </p>
                  <p className="text-sm text-warning mb-6">
                    (Practice mode - no stats recorded)
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={startGame}
                      className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-all"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={() => navigate('/games/chess/learn')}
                      className="px-6 py-3 rounded-xl glass-button-secondary transition-all"
                    >
                      Back to Hub
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Move History */}
          <div className="w-full lg:w-64 p-4 rounded-xl glass-surface-2">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Move History
            </h3>
            
            <div className="mb-4 p-3 rounded-lg glass-chip">
              <p className="text-sm text-muted-strong">
                Turn: <span className="font-bold text-foreground">{currentTurn === 'white' ? 'White' : 'Black'}</span>
              </p>
              <p className="text-sm text-muted-strong">
                Mode: <span className="font-bold text-foreground">Practice ({difficulty})</span>
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-1">
              {moveHistory.length === 0 ? (
                <p className="text-sm text-muted-strong italic">No moves yet</p>
              ) : (
                moveHistory.map((move, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-primary/5"
                  >
                    <span className="text-muted-strong w-6">{Math.floor(i / 2) + 1}.</span>
                    <span className={cn(
                      "font-mono",
                      move.piece.color === 'white' ? "text-foreground" : "text-accent"
                    )}>
                      {getMoveNotation(move)}
                    </span>
                    {move.captured && <span className="text-destructive text-xs">×</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
