import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSounds } from '@/shared/hooks/useGameSounds';
import { supabase } from '@/integrations/supabase/client';
import { ChessBoard } from '../components/ChessBoard';
import { getPuzzleById, PUZZLES, FREE_PUZZLE_COUNT, PUZZLE_UNLOCK_COST, PUZZLE_REWARDS } from './puzzles';
import {
  Board,
  Position,
  getLegalMoves,
  makeMove,
  Move,
  cloneBoard
} from '../chessLogic';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  CheckCircle,
  XCircle,
  Coins,
  Lock,
  Loader2,
  Unlock,
  Target
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function ChessPuzzle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { playSound } = useGameSounds();
  
  const puzzle = getPuzzleById(Number(id));
  const puzzleIndex = PUZZLES.findIndex(p => p.id === Number(id));
  const isFree = puzzleIndex < FREE_PUZZLE_COUNT;
  
  const [board, setBoard] = useState<Board>([]);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [allUnlockedPuzzles, setAllUnlockedPuzzles] = useState<number[]>([]);
  
  const checkUnlockStatus = useCallback(async () => {
    if (!user || !puzzle) return;
    
    // Check if already unlocked
    const { data: unlockData } = await supabase
      .from('chess_puzzle_unlocks')
      .select('puzzle_id')
      .eq('user_id', user.id)
      .eq('puzzle_id', puzzle.id)
      .single();
    
    if (unlockData || isFree) {
      setIsUnlocked(true);
    }
    
    // Check if already completed
    const { data: completionData } = await supabase
      .from('chess_puzzle_completions')
      .select('puzzle_id')
      .eq('user_id', user.id)
      .eq('puzzle_id', puzzle.id)
      .single();
    
    if (completionData) {
      setAlreadyCompleted(true);
    }
    
    setIsLoading(false);
  }, [user, puzzle, isFree]);

  useEffect(() => {
    if (user && puzzle) {
      checkUnlockStatus();
    } else {
      setIsLoading(false);
    }
  }, [user, puzzle, checkUnlockStatus]);
  
  const unlockPuzzle = async () => {
    if (!user || !profile || !puzzle) return;
    if ((profile.coins ?? 0) < PUZZLE_UNLOCK_COST) return;
    
    playSound('success');
    
    // Deduct coins
    await updateProfile({ coins: (profile.coins ?? 0) - PUZZLE_UNLOCK_COST });
    
    // Save unlock
    await supabase
      .from('chess_puzzle_unlocks')
      .insert({
        user_id: user.id,
        puzzle_id: puzzle.id
      });
    
    setIsUnlocked(true);
    setBoard(cloneBoard(puzzle.board));
  };
  
  const handleSquareClick = (row: number, col: number) => {
    if (puzzleCompleted || !puzzle) return;
    
    const clickedPiece = board[row][col];
    
    // If we have a selected square
    if (selectedSquare) {
      const move = legalMoves.find(m => m.to.row === row && m.to.col === col);
      
      if (move) {
        const expectedMove = puzzle.solution[currentMoveIndex];
        
        // Check if this is the correct move
        if (
          move.from.row === expectedMove.from.row &&
          move.from.col === expectedMove.from.col &&
          move.to.row === expectedMove.to.row &&
          move.to.col === expectedMove.to.col
        ) {
          // Correct move!
          playSound('success');
          const newBoard = makeMove(board, move);
          setBoard(newBoard);
          setLastMove({ from: move.from, to: move.to });
          
          if (currentMoveIndex === puzzle.solution.length - 1) {
            // Puzzle complete!
            completePuzzle();
          } else {
            setCurrentMoveIndex(prev => prev + 1);
            setFeedback({ type: 'success', message: 'Excellent! Find the next move.' });
            setTimeout(() => setFeedback(null), 2000);
          }
        } else {
          // Wrong move - friendly feedback
          playSound('failure');
          setAttempts(prev => prev + 1);
          setFeedback({ type: 'error', message: "Not quite! That's not the best move here. Try again!" });
          
          // Reset the board after wrong move
          setTimeout(() => {
            setBoard(cloneBoard(puzzle.board));
            setCurrentMoveIndex(0);
            setLastMove(null);
            setFeedback(null);
          }, 1500);
        }
        
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }
    
    // Select a piece (only player's color)
    if (clickedPiece && clickedPiece.color === puzzle.playerColor) {
      playSound('click');
      setSelectedSquare({ row, col });
      const moves = getLegalMoves(board, puzzle.playerColor)
        .filter(m => m.from.row === row && m.from.col === col);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };
  
  const completePuzzle = async () => {
    if (!user || !profile || !puzzle) return;
    
    setPuzzleCompleted(true);
    playSound('success');
    setFeedback({ type: 'success', message: puzzle.explanation });
    
    if (!alreadyCompleted) {
      // Save completion
      await supabase
        .from('chess_puzzle_completions')
        .upsert({
          user_id: user.id,
          puzzle_id: puzzle.id,
          attempts,
          completed_at: new Date().toISOString()
        });
      
      // Award coins based on difficulty
      const reward = PUZZLE_REWARDS[puzzle.difficulty];
      await updateProfile({
        coins: (profile.coins ?? 0) + reward
      });
    }
  };
  
  const resetPuzzle = () => {
    if (!puzzle) return;
    
    setBoard(cloneBoard(puzzle.board));
    setSelectedSquare(null);
    setLegalMoves([]);
    setFeedback(null);
    setCurrentMoveIndex(0);
    setPuzzleCompleted(false);
    setShowHint(false);
    setLastMove(null);
  };
  
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
          <p className="text-muted-strong mb-6">Please sign in to solve puzzles.</p>
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
  
  if (!puzzle) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Puzzle Not Found</h2>
          <button
            onClick={() => navigate('/games/chess/learn')}
            className="px-6 py-3 rounded-xl glass-button-secondary transition-all"
          >
            Back to Learning Hub
          </button>
        </div>
      </Layout>
    );
  }
  
  // Show unlock screen if puzzle is locked
  if (!isFree && !isUnlocked) {
    const canAffordPuzzle = (profile?.coins ?? 0) >= PUZZLE_UNLOCK_COST;
    
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="p-8 rounded-2xl glass-surface-2">
              <Lock className="w-16 h-16 mx-auto mb-4 text-muted-strong" />
              <h2 className="text-2xl font-bold text-foreground mb-2">{puzzle.title}</h2>
              <p className="text-muted-strong mb-2">{puzzle.objective}</p>
              <p className="text-sm text-muted-strong mb-6 capitalize">
                {puzzle.difficulty} • {puzzle.category.replace('-', ' ')}
              </p>
              
              <div className="flex items-center justify-center gap-2 mb-6 p-4 rounded-xl glass-chip">
                <Coins className="w-6 h-6 text-coin" />
                <span className="text-xl font-bold">{PUZZLE_UNLOCK_COST} coins to unlock</span>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-muted-strong">Your balance:</span>
                <Coins className="w-5 h-5 text-coin" />
                <span className="font-bold">{profile?.coins ?? 0}</span>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={unlockPuzzle}
                  disabled={!canAffordPuzzle}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    canAffordPuzzle
                      ? "gradient-primary text-primary-foreground hover:opacity-90"
                      : "glass-button-disabled cursor-not-allowed"
                  )}
                >
                  <Unlock className="w-5 h-5" />
                  {canAffordPuzzle ? 'Unlock Puzzle' : 'Not enough coins'}
                </button>
                <button
                  onClick={() => navigate('/games/chess/learn')}
                  className="w-full py-3 rounded-xl glass-button-secondary transition-all"
                >
                  Back to Puzzles
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Find next UNLOCKED puzzle - skip locked ones
  const getNextPlayablePuzzle = () => {
    const currentIndex = PUZZLES.findIndex(p => p.id === puzzle.id);
    for (let i = currentIndex + 1; i < PUZZLES.length; i++) {
      const nextP = PUZZLES[i];
      const isFreeNext = i < FREE_PUZZLE_COUNT;
      const isUnlockedNext = isFreeNext || allUnlockedPuzzles.includes(nextP.id);
      if (isUnlockedNext) return nextP;
    }
    return null; // No more unlocked puzzles
  };
  
  const nextPlayablePuzzle = getNextPlayablePuzzle();
  const reward = PUZZLE_REWARDS[puzzle.difficulty];
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/games/chess/learn')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass-button-secondary transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Exit
          </button>
          
          <div className="text-center">
            <h2 className="font-bold text-foreground">{puzzle.title}</h2>
            <p className="text-sm text-muted-strong capitalize">
              {puzzle.difficulty} • {puzzle.category.replace('-', ' ')}
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-chip">
            <Coins className="w-5 h-5 text-coin" />
            <span className="font-bold">{profile?.coins ?? 0}</span>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Chess Board - Using reusable component */}
          <div className="relative">
            <ChessBoard
              board={board}
              theme="classic"
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={handleSquareClick}
              lastMove={lastMove}
              disabled={puzzleCompleted}
            />
            
            {/* Puzzle Complete Overlay */}
            {puzzleCompleted && (
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-xl animate-fade-in">
                <div className="text-center p-6">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success animate-bounce" />
                  <h2 className="text-xl font-bold text-foreground mb-2">Puzzle Solved!</h2>
                  
                  {!alreadyCompleted && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Coins className="w-5 h-5 text-coin" />
                      <span className="font-bold text-coin">+{reward}</span>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-strong mb-4">
                    Solved in {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    {nextPlayablePuzzle ? (
                      <button
                        onClick={() => {
                          setBoard([]);
                          setSelectedSquare(null);
                          setLegalMoves([]);
                          setFeedback(null);
                          setCurrentMoveIndex(0);
                          setPuzzleCompleted(false);
                          setShowHint(false);
                          setAttempts(1);
                          setLastMove(null);
                          setAlreadyCompleted(false);
                          navigate(`/games/chess/puzzle/${nextPlayablePuzzle.id}`);
                        }}
                        className="py-2 px-4 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        Next Puzzle
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="py-3 px-4 rounded-xl glass-chip text-center">
                        <Lock className="w-5 h-5 mx-auto mb-2 text-muted-strong" />
                        <p className="text-sm text-muted-strong">Unlock more puzzles to continue!</p>
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/games/chess/learn')}
                      className="py-2 px-4 rounded-xl glass-button-secondary transition-all"
                    >
                      Back to Puzzles
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Instructions Panel */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Objective */}
            <div className="p-6 rounded-xl glass-surface-2">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Objective</h3>
              </div>
              <p className="text-foreground">{puzzle.objective}</p>
              {puzzle.solution.length > 1 && (
                <p className="text-sm text-muted-strong mt-2">
                  Move {currentMoveIndex + 1} of {puzzle.solution.length}
                </p>
              )}
            </div>
            
            {/* Feedback */}
            {feedback && (
              <div className={cn(
                "p-4 rounded-xl flex items-start gap-3 animate-fade-in",
                feedback.type === 'success' ? "bg-success/10 border border-success/50" : "bg-destructive/10 border border-destructive/50"
              )}>
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <p className={cn(
                  "text-sm",
                  feedback.type === 'success' ? "text-success" : "text-destructive"
                )}>
                  {feedback.message}
                </p>
              </div>
            )}
            
            {/* Hint */}
            {!puzzleCompleted && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="w-full p-4 rounded-xl glass-button-secondary transition-all flex items-center gap-2"
              >
                <Lightbulb className="w-5 h-5 text-coin" />
                <span className="text-sm">
                  {showHint ? puzzle.hint : 'Need a hint?'}
                </span>
              </button>
            )}
            
            {/* Stats */}
            <div className="p-4 rounded-xl glass-chip">
              <div className="flex justify-between text-sm">
                <span className="text-muted-strong">Attempts:</span>
                <span className="font-bold">{attempts}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-strong">Reward:</span>
                <span className="font-bold text-coin flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  +{reward}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <button
              onClick={resetPuzzle}
              className="w-full py-3 rounded-xl glass-button-secondary transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Puzzle
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
