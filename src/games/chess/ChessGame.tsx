import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSounds } from '@/hooks/useGameSounds';
import { useCoinEconomy, ECONOMY } from '@/hooks/useCoinEconomy';
import { supabase } from '@/integrations/supabase/client';
import { ChessPiece } from './ChessPiece';
import { BOARD_THEMES, BoardTheme, getThemeById } from './themes';
import { AdsRewardButton } from '@/components/AdsRewardButton';
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
} from './chessLogic';
import {
  ChevronLeft,
  RotateCcw,
  Crown,
  Users,
  Cpu,
  Lock,
  Unlock,
  Coins,
  Trophy,
  Clock,
  Loader2,
  Settings,
  Play,
  CheckCircle,
  BookOpen,
  AlertTriangle,
  Swords
} from 'lucide-react';
import { cn } from '@/lib/utils';

type GameMode = 'menu' | 'settings' | 'shop' | 'playing' | 'match-confirm';
type OpponentType = 'ai' | 'local';
type Difficulty = 'easy' | 'medium' | 'hard';
type MatchType = 'ranked' | 'casual';

interface AnimatingPiece {
  from: Position;
  to: Position;
  piece: { type: PieceType; color: PieceColor };
}

export default function ChessGame() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading: authLoading, refreshProfile } = useAuth();
  const { playSound } = useGameSounds();
  const { payMatchFee, processRankedWin, processRankedLoss, processRankedDraw, canAfford, processCoinChange } = useCoinEconomy();
  
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [opponentType, setOpponentType] = useState<OpponentType>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [matchType, setMatchType] = useState<MatchType>('ranked');
  const [matchFeePaid, setMatchFeePaid] = useState(false);
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
  
  // Animation and move highlight state
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  
  // Theme and shop
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');
  const [unlockedBoards, setUnlockedBoards] = useState<string[]>(['classic']);
  const [isLoading, setIsLoading] = useState(true);
  
  // Timer
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [gameTime, setGameTime] = useState<number>(0);
  
  // Board size ref for fixed aspect ratio
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(480);
  
  // Calculate board size on mount and resize
  useEffect(() => {
    const calculateBoardSize = () => {
      const maxSize = Math.min(window.innerWidth * 0.85, 520);
      const size = Math.floor(maxSize / 8) * 8; // Ensure divisible by 8
      setBoardSize(size);
    };
    
    calculateBoardSize();
    window.addEventListener('resize', calculateBoardSize);
    return () => window.removeEventListener('resize', calculateBoardSize);
  }, []);
  
  // Load unlocked boards
  useEffect(() => {
    if (user) {
      loadUnlockedBoards();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  const loadUnlockedBoards = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('unlocked_chess_boards')
      .select('board_id')
      .eq('user_id', user.id);
    
    if (!error && data) {
      const boards = data.map(d => d.board_id);
      setUnlockedBoards(['classic', ...boards]);
    }
    setIsLoading(false);
  };
  
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
  
  // Handle game end with economy system
  const handleGameEnd = useCallback(async (result: 'win' | 'loss' | 'draw') => {
    if (!user || !profile) return;
    
    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Play sounds
    if (result === 'win') {
      playSound('checkmate');
    }
    
    // Save game result
    await supabase
      .from('chess_game_results')
      .insert({
        user_id: user.id,
        opponent_type: opponentType,
        difficulty: opponentType === 'ai' ? difficulty : null,
        result,
        moves_count: moveHistory.length,
        duration_seconds: duration,
        board_theme: selectedTheme
      });
    
    // Handle rewards based on match type
    if (matchType === 'ranked' && matchFeePaid && opponentType === 'ai') {
      // Ranked mode - use economy system
      if (result === 'win') {
        await processRankedWin(difficulty);
        await updateProfile({
          xp: (profile.xp ?? 0) + ECONOMY.RANKED_MATCH_FEE[difficulty] * 2,
          games_played: (profile.games_played ?? 0) + 1,
          wins: (profile.wins ?? 0) + 1
        });
      } else if (result === 'draw') {
        await processRankedDraw(difficulty);
        await updateProfile({
          xp: (profile.xp ?? 0) + 10,
          games_played: (profile.games_played ?? 0) + 1
        });
      } else {
        await processRankedLoss();
        await updateProfile({
          games_played: (profile.games_played ?? 0) + 1
        });
      }
      
      // Record ranked match history
      await supabase
        .from('ranked_match_history')
        .insert({
          user_id: user.id,
          match_fee: ECONOMY.RANKED_MATCH_FEE[difficulty],
          result,
          coins_gained: result === 'win' ? ECONOMY.RANKED_MATCH_FEE[difficulty] * 3 : 
                        result === 'draw' ? ECONOMY.RANKED_MATCH_FEE[difficulty] : 0
        });
    } else {
      // Casual mode (local multiplayer) - small rewards
      if (result === 'win') {
        await processCoinChange(15, 'ranked_win', 'Won casual chess match');
        await updateProfile({
          xp: (profile.xp ?? 0) + 20,
          games_played: (profile.games_played ?? 0) + 1,
          wins: (profile.wins ?? 0) + 1
        });
      } else {
        await updateProfile({
          games_played: (profile.games_played ?? 0) + 1
        });
      }
    }
    
    await refreshProfile();
  }, [user, profile, gameStartTime, opponentType, difficulty, matchType, matchFeePaid, moveHistory.length, selectedTheme, updateProfile, playSound, processRankedWin, processRankedDraw, processRankedLoss, processCoinChange, refreshProfile]);
  
  // Execute a move with animation
  const executeMove = useCallback((move: Move, boardState: Board, turn: PieceColor) => {
    // Play appropriate sound
    if (move.captured) {
      playSound('capture');
    } else if (move.isCastling) {
      playSound('move');
    } else {
      playSound('move');
    }
    
    // Animate if enabled
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
    
    // Update en passant target
    const newEnPassant = move.piece.type === 'pawn' && Math.abs(move.from.row - move.to.row) === 2
      ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
      : undefined;
    setEnPassantTarget(newEnPassant);
    
    // Check game state
    const nextColor = turn === 'white' ? 'black' : 'white';
    const state = getGameState(newBoard, nextColor, newEnPassant);
    
    // Check if in check
    if (isInCheck(newBoard, nextColor)) {
      playSound('check');
    }
    
    if (state === 'checkmate') {
      setGameResult('checkmate');
      setWinner(turn);
      handleGameEnd(turn === 'white' ? 'win' : 'loss');
    } else if (state === 'stalemate') {
      setGameResult('stalemate');
      handleGameEnd('draw');
    } else {
      setCurrentTurn(nextColor);
    }
  }, [handleGameEnd, animationsEnabled, playSound]);
  
  // AI move effect
  useEffect(() => {
    if (gameMode !== 'playing') return;
    if (gameResult !== 'playing') return;
    if (opponentType !== 'ai') return;
    if (currentTurn !== 'black') return;
    
    setIsAIThinking(true);
    
    // Use setTimeout to allow UI to update
    const timeout = setTimeout(() => {
      const aiMove = getAIMove(board, 'black', difficulty, enPassantTarget);
      
      if (aiMove) {
        executeMove(aiMove, board, currentTurn);
      }
      
      setIsAIThinking(false);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [currentTurn, gameMode, gameResult, opponentType, board, difficulty, enPassantTarget, executeMove]);
  
  const showMatchConfirmation = (opponent: OpponentType) => {
    setOpponentType(opponent);
    if (opponent === 'ai' && matchType === 'ranked') {
      setGameMode('match-confirm');
    } else {
      startGame(opponent, false);
    }
  };
  
  const confirmAndStartRankedMatch = async () => {
    const feeResult = await payMatchFee(difficulty);
    if (feeResult.success) {
      await refreshProfile();
      startGame(opponentType, true);
    } else {
      playSound('failure');
    }
  };
  
  const startGame = (opponent: OpponentType, feePaid: boolean = false) => {
    playSound('click');
    setOpponentType(opponent);
    setMatchFeePaid(feePaid);
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
    setGameStartTime(Date.now());
    setGameTime(0);
    setGameMode('playing');
    setLastMove(null);
  };
  
  const handleSquareClick = (row: number, col: number) => {
    if (gameResult !== 'playing') return;
    if (isAIThinking) return;
    if (promotionPending) return;
    if (animatingPiece) return;
    
    // In AI mode, player is always white
    if (opponentType === 'ai' && currentTurn === 'black') return;
    
    const clickedPiece = board[row][col];
    
    // If we have a selected piece
    if (selectedSquare) {
      // Check if this is a legal move
      const move = legalMoves.find(m => m.to.row === row && m.to.col === col);
      
      if (move) {
        // Check for pawn promotion
        if (move.piece.type === 'pawn' && (row === 0 || row === 7)) {
          setPromotionPending({ from: move.from, to: move.to });
          return;
        }
        
        executeMove(move, board, currentTurn);
        return;
      }
    }
    
    // Select a new piece
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
  
  const unlockBoard = async (theme: BoardTheme) => {
    if (!user || !profile) return;
    if (profile.coins < theme.price) return;
    if (unlockedBoards.includes(theme.id)) return;
    
    playSound('success');
    
    // Deduct coins
    await updateProfile({ coins: profile.coins - theme.price });
    
    // Save unlocked board
    await supabase
      .from('unlocked_chess_boards')
      .insert({
        user_id: user.id,
        board_id: theme.id
      });
    
    setUnlockedBoards(prev => [...prev, theme.id]);
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const currentTheme = getThemeById(selectedTheme);
  const squareSize = boardSize / 8;
  
  if (authLoading || isLoading) {
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
          <Crown className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to Play</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to save your progress.</p>
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
  
  // Main Menu
  if (gameMode === 'menu') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Chess</h1>
              <p className="text-muted-foreground">Test your strategy against AI or friends</p>
            </div>
            <button
              onClick={() => navigate('/games')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Games
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Learn Chess */}
            <div
              onClick={() => navigate('/games/chess/learn')}
              className="p-8 rounded-2xl bg-card border border-border hover:glow-card transition-all cursor-pointer"
            >
              <BookOpen className="w-12 h-12 mb-4 text-success" />
              <h3 className="text-xl font-bold text-foreground mb-2">Learn Chess</h3>
              <p className="text-sm text-muted-foreground">Tutorials, puzzles & practice mode</p>
            </div>
            
            {/* Play vs AI */}
            <div
              onClick={() => setGameMode('settings')}
              className="p-8 rounded-2xl bg-card border border-border hover:glow-card transition-all cursor-pointer"
            >
              <Cpu className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-bold text-foreground mb-2">Play vs AI</h3>
              <p className="text-sm text-muted-foreground">Challenge the computer at different difficulty levels</p>
            </div>
            
            {/* Local Multiplayer */}
            <div
              onClick={() => startGame('local', false)}
              className="p-8 rounded-2xl bg-card border border-border hover:glow-card transition-all cursor-pointer"
            >
              <Users className="w-12 h-12 mb-4 text-accent" />
              <h3 className="text-xl font-bold text-foreground mb-2">Local Multiplayer</h3>
              <p className="text-sm text-muted-foreground">Play against a friend on the same device</p>
            </div>
            
            {/* Board Shop */}
            <div
              onClick={() => setGameMode('shop')}
              className="p-8 rounded-2xl bg-card border border-border hover:glow-card transition-all cursor-pointer"
            >
              <Crown className="w-12 h-12 mb-4 text-coin" />
              <h3 className="text-xl font-bold text-foreground mb-2">Board Shop</h3>
              <p className="text-sm text-muted-foreground">Unlock beautiful chess board themes</p>
            </div>
          </div>
          
          {/* Current Board Theme Preview */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">Current Board: {currentTheme.name}</p>
            <div className="inline-flex gap-1">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: i % 2 === 0 ? currentTheme.lightSquare : currentTheme.darkSquare }}
                />
              ))}
            </div>
          </div>
          
          {/* Animation Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm transition-all",
                animationsEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              Animations: {animationsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // AI Settings
  if (gameMode === 'settings') {
    const matchFee = ECONOMY.RANKED_MATCH_FEE[difficulty];
    const potentialWin = matchFee * ECONOMY.RANKED_WINNER_MULTIPLIER;
    const userCanAfford = canAfford(matchFee);
    
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <button
            onClick={() => setGameMode('menu')}
            className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          
          {/* Match Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMatchType('ranked')}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                matchType === 'ranked'
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Swords className="w-4 h-4" />
              Ranked
            </button>
            <button
              onClick={() => setMatchType('casual')}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold transition-all",
                matchType === 'casual'
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              Casual
            </button>
          </div>
          
          {matchType === 'ranked' && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning mb-1">Ranked Match</p>
                  <p className="text-warning/80">
                    Entry fee: <strong>{matchFee}</strong> coins. 
                    Win: <strong className="text-success">+{potentialWin}</strong> | 
                    Lose: <strong className="text-destructive">-{matchFee}</strong> | 
                    Draw: <strong>0</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Select Difficulty</h2>
          
          <div className="space-y-4">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
              const fee = ECONOMY.RANKED_MATCH_FEE[d];
              const win = fee * ECONOMY.RANKED_WINNER_MULTIPLIER;
              
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "w-full p-6 rounded-2xl border-2 transition-all text-left",
                    difficulty === d
                      ? "border-primary bg-primary/10 glow-card"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground capitalize">{d}</h3>
                      <p className="text-sm text-muted-foreground">
                        {d === 'easy' && 'Perfect for beginners'}
                        {d === 'medium' && 'Balanced challenge'}
                        {d === 'hard' && 'For experienced players'}
                      </p>
                    </div>
                    {matchType === 'ranked' ? (
                      <div className="text-right">
                        <div className="text-coin flex items-center gap-1 justify-end">
                          <span className="text-xs text-muted-foreground">Fee:</span>
                          <Coins className="w-4 h-4" />
                          {fee}
                        </div>
                        <div className="text-success text-sm mt-1">
                          Win: +{win}
                        </div>
                      </div>
                    ) : (
                      <div className="text-coin flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        +15
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Coins display */}
          <div className="flex items-center justify-center gap-2 mt-6 p-3 rounded-xl bg-muted/50">
            <span className="text-muted-foreground">Your balance:</span>
            <Coins className="w-5 h-5 text-coin" />
            <span className="font-bold">{profile?.coins ?? 0}</span>
          </div>
          
          <button
            onClick={() => showMatchConfirmation('ai')}
            disabled={matchType === 'ranked' && !userCanAfford}
            className={cn(
              "w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
              matchType === 'ranked' && !userCanAfford
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
            )}
          >
            <Play className="w-5 h-5" />
            {matchType === 'ranked' && !userCanAfford ? 'Not Enough Coins' : 'Start Game'}
          </button>
          
          {matchType === 'ranked' && !userCanAfford && (
            <div className="mt-4">
              <AdsRewardButton onRewardClaimed={() => {}} />
            </div>
          )}
        </div>
      </Layout>
    );
  }
  
  // Match Confirmation Screen
  if (gameMode === 'match-confirm') {
    const matchFee = ECONOMY.RANKED_MATCH_FEE[difficulty];
    const potentialWin = matchFee * ECONOMY.RANKED_WINNER_MULTIPLIER;
    const userCanAfford = canAfford(matchFee);
    
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="p-8 rounded-2xl bg-card border border-border text-center">
            <Swords className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Ranked Match</h2>
            <p className="text-muted-foreground mb-6 capitalize">
              {difficulty} difficulty vs AI
            </p>
            
            <div className="p-4 rounded-xl bg-muted/50 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Entry Fee:</span>
                <span className="font-bold text-destructive flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  -{matchFee}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">If You Win:</span>
                <span className="font-bold text-success flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  +{potentialWin}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">If You Lose:</span>
                <span className="font-bold text-destructive">0 (fee lost)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">If Draw:</span>
                <span className="font-bold">Fee Refunded</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">Your balance:</span>
              <Coins className="w-5 h-5 text-coin" />
              <span className="font-bold">{profile?.coins ?? 0}</span>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setGameMode('settings')}
                className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndStartRankedMatch}
                disabled={!userCanAfford}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                  userCanAfford
                    ? "gradient-primary text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Coins className="w-4 h-4" />
                Pay & Play
              </button>
            </div>
            
            {!userCanAfford && (
              <div className="mt-4">
                <AdsRewardButton onRewardClaimed={() => {}} />
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }
  
  // Board Shop
  if (gameMode === 'shop') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Board Shop</h2>
              <p className="text-muted-foreground">Customize your chess experience</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
                <Coins className="w-5 h-5 text-coin" />
                <span className="font-bold">{profile?.coins ?? 0}</span>
              </div>
              <button
                onClick={() => setGameMode('menu')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Common/Rare boards */}
            {BOARD_THEMES.filter(t => !t.tier).map(theme => {
              const isUnlocked = unlockedBoards.includes(theme.id);
              const isSelected = selectedTheme === theme.id;
              const canAffordTheme = (profile?.coins ?? 0) >= theme.price;
              
              return (
                <div
                  key={theme.id}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 glow-card"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  {/* Preview */}
                  <div className="grid grid-cols-4 gap-0.5 mb-4 rounded-lg overflow-hidden aspect-square">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
                      <div
                        key={i}
                        className="aspect-square"
                        style={{
                          backgroundColor: (Math.floor(i / 4) + i) % 2 === 0
                            ? theme.lightSquare
                            : theme.darkSquare
                        }}
                      />
                    ))}
                  </div>
                  
                  <h3 className="font-bold text-foreground mb-1">{theme.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{theme.preview}</p>
                  
                  {isUnlocked ? (
                    <button
                      onClick={() => setSelectedTheme(theme.id)}
                      className={cn(
                        "w-full py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        isSelected
                          ? "bg-success text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => unlockBoard(theme)}
                      disabled={!canAffordTheme}
                      className={cn(
                        "w-full py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        canAffordTheme
                          ? "gradient-primary text-primary-foreground hover:opacity-90"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {canAffordTheme ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <Coins className="w-4 h-4" />
                      {theme.price}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legendary Tier Section */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-coin" />
              <h3 className="text-xl font-bold text-foreground">Legendary Collection</h3>
              <span className="px-2 py-1 rounded-full bg-coin/20 text-coin text-xs font-bold">PREMIUM</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {BOARD_THEMES.filter(t => t.tier === 'legendary').map(theme => {
                const isUnlocked = unlockedBoards.includes(theme.id);
                const isSelected = selectedTheme === theme.id;
                const canAffordTheme = (profile?.coins ?? 0) >= theme.price;
                
                return (
                  <div
                    key={theme.id}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all relative overflow-hidden",
                      isSelected
                        ? "border-coin bg-coin/10 glow-card"
                        : "border-coin/30 bg-card hover:border-coin/60"
                    )}
                  >
                    {/* Legendary badge */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-coin text-background text-xs font-bold">
                      ★ LEGENDARY
                    </div>
                    
                    {/* Preview with glow effect */}
                    <div className="grid grid-cols-4 gap-0.5 mb-4 rounded-lg overflow-hidden aspect-square shadow-lg" style={{ boxShadow: `0 0 20px ${theme.lightSquare}40` }}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
                        <div
                          key={i}
                          className="aspect-square"
                          style={{
                            backgroundColor: (Math.floor(i / 4) + i) % 2 === 0
                              ? theme.lightSquare
                              : theme.darkSquare
                          }}
                        />
                      ))}
                    </div>
                    
                    <h3 className="font-bold text-coin mb-1">{theme.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{theme.preview}</p>
                    
                    {isUnlocked ? (
                      <button
                        onClick={() => setSelectedTheme(theme.id)}
                        className={cn(
                          "w-full py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                          isSelected
                            ? "bg-coin text-background"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Selected
                          </>
                        ) : (
                          'Select'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => unlockBoard(theme)}
                        disabled={!canAffordTheme}
                        className={cn(
                          "w-full py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                          canAffordTheme
                            ? "bg-coin text-background hover:opacity-90"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        {canAffordTheme ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        <Coins className="w-4 h-4" />
                        {theme.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
              onClick={() => setGameMode('menu')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Exit
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
              <Clock className="w-5 h-5" />
              {formatTime(gameTime)}
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
            onClick={() => startGame(opponentType)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Chess Board - Fixed aspect ratio */}
          <div 
            ref={boardRef}
            className="relative flex-shrink-0"
            style={{ width: boardSize, height: boardSize }}
          >
            <div 
              className="grid grid-cols-8 gap-0 rounded-xl overflow-hidden shadow-2xl"
              style={{ 
                width: boardSize, 
                height: boardSize,
                aspectRatio: '1 / 1'
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((square, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isSelected = selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
                  const isLegalMove = legalMoves.some(m => m.to.row === rowIndex && m.to.col === colIndex);
                  const isCapture = isLegalMove && square !== null;
                  const isAnimating = animatingPiece && 
                    animatingPiece.to.row === rowIndex && 
                    animatingPiece.to.col === colIndex;
                  const isLastMoveSquare = lastMove && (
                    (lastMove.from.row === rowIndex && lastMove.from.col === colIndex) ||
                    (lastMove.to.row === rowIndex && lastMove.to.col === colIndex)
                  );
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      className={cn(
                        "flex items-center justify-center cursor-pointer transition-all relative",
                        isSelected && "ring-4 ring-primary ring-inset"
                      )}
                      style={{
                        width: squareSize,
                        height: squareSize,
                        backgroundColor: isLight ? currentTheme.lightSquare : currentTheme.darkSquare
                      }}
                    >
                      {/* Last move highlight */}
                      {isLastMoveSquare && (
                        <div className="absolute inset-0 bg-primary/30 pointer-events-none" />
                      )}
                      {/* Legal move indicator */}
                      {isLegalMove && !isCapture && (
                        <div 
                          className="absolute rounded-full bg-primary/50 transition-transform hover:scale-110"
                          style={{ width: squareSize * 0.33, height: squareSize * 0.33 }}
                        />
                      )}
                      
                      {/* Capture indicator */}
                      {isCapture && (
                        <div 
                          className="absolute rounded-full border-4 border-destructive/50"
                          style={{ 
                            width: squareSize - 8, 
                            height: squareSize - 8 
                          }}
                        />
                      )}
                      
                      {/* Piece */}
                      {square && (
                        <div className={cn(
                          "transition-all duration-200",
                          isAnimating && animationsEnabled && "animate-scale-in"
                        )}>
                          <ChessPiece 
                            piece={square} 
                            size={squareSize * 0.85}
                            isAnimating={isAnimating && animationsEnabled}
                          />
                        </div>
                      )}
                      
                      {/* Coordinates */}
                      {colIndex === 0 && (
                        <span 
                          className="absolute top-0.5 left-1 text-xs font-bold opacity-50"
                          style={{ color: isLight ? currentTheme.darkSquare : currentTheme.lightSquare }}
                        >
                          {8 - rowIndex}
                        </span>
                      )}
                      {rowIndex === 7 && (
                        <span 
                          className="absolute bottom-0.5 right-1 text-xs font-bold opacity-50"
                          style={{ color: isLight ? currentTheme.darkSquare : currentTheme.lightSquare }}
                        >
                          {'abcdefgh'[colIndex]}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Promotion Dialog */}
            {promotionPending && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm font-medium text-foreground mb-3 text-center">Promote to:</p>
                  <div className="flex gap-2">
                    {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => handlePromotion(type)}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-all"
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
                    winner === 'white' ? "text-coin animate-bounce" : winner === 'black' ? "text-accent" : "text-muted-foreground"
                  )} />
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {gameResult === 'checkmate' && `${winner === 'white' ? 'White' : 'Black'} Wins!`}
                    {gameResult === 'stalemate' && 'Stalemate!'}
                    {gameResult === 'draw' && 'Draw!'}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {gameResult === 'checkmate' && 'Checkmate!'}
                    {gameResult === 'stalemate' && 'No legal moves available'}
                    {gameResult === 'draw' && 'The game ended in a draw'}
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => startGame(opponentType)}
                      className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-all"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={() => setGameMode('menu')}
                      className="px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-all"
                    >
                      Menu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Move History */}
          <div className="w-full lg:w-64 p-4 rounded-xl bg-card border border-border">
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Move History
            </h3>
            
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Turn: <span className="font-bold text-foreground">{currentTurn === 'white' ? 'White' : 'Black'}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Mode: <span className="font-bold text-foreground">
                  {opponentType === 'ai' ? `AI (${difficulty})` : 'Local'}
                </span>
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-1">
              {moveHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No moves yet</p>
              ) : (
                moveHistory.map((move, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-muted/50"
                  >
                    <span className="text-muted-foreground w-6">{Math.floor(i / 2) + 1}.</span>
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
