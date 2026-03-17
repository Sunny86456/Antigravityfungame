/**
 * Chess Tutorial Engine Component
 * 
 * A complete rewrite of the tutorial system that:
 * - Shows ALL legal moves for allowed pieces
 * - Properly validates moves against real chess rules
 * - Supports explore mode (any legal move) and specific mode (exact move required)
 * - Tracks progress in Supabase
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSounds } from '@/hooks/useGameSounds';
import { supabase } from '@/integrations/supabase/client';
import { ChessBoard } from '../components/ChessBoard';
import { Lesson, LESSONS, getLessonById } from './lessonData';
import {
  Board,
  Move,
  Position,
  PieceType,
  getLegalMoves,
  makeMove,
  isInCheck,
  getGameState,
  cloneBoard,
  getMoveNotation
} from '../chessLogic';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { ChessValidator } from './ChessValidator';

type Feedback = { type: 'success' | 'error' | 'info'; message: string } | null;

function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function moveMatchesAccepted(
  move: Move,
  accepted: { from: Position; to: Position; promotion?: PieceType }
): boolean {
  return (
    positionsEqual(move.from, accepted.from) &&
    positionsEqual(move.to, accepted.to) &&
    (move.promotion ?? null) === (accepted.promotion ?? null)
  );
}

export default function ChessTutorialEngine() {
  const { id } = useParams<{ id: string }>();
  const lessonId = Number(id);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { playSound } = useGameSounds();

  const lesson = useMemo(() => getLessonById(lessonId), [lessonId]);

  const [board, setBoard] = useState<Board>(() => lesson?.board ? cloneBoard(lesson.board) : []);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showHint, setShowHint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [illegalMoveMessage, setIllegalMoveMessage] = useState<string | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Reset when lesson changes
  useEffect(() => {
    if (!lesson) {
      setIsLoading(false);
      return;
    }
    setBoard(cloneBoard(lesson.board));
    setSelectedSquare(null);
    setLegalMoves([]);
    setFeedback(null);
    setShowHint(false);
    setIsCompleted(false);
    setLastMove(null);
    setLastMove(null);
    setMoveCount(0);
    setShowIntro(true);
    setIllegalMoveMessage(null);
    setLessonError(null);

    // SANITY CHECK & AUDIT SYSTEM
    if (lesson) {
      const audits = ChessValidator.sanityCheckLesson(lesson);
      if (audits.length > 0) {
        console.error('Lesson Security Audit Failed:', audits);

        const isDev = import.meta.env.MODE === 'development';

        if (isDev) {
          // DEVELOPER MODE: Fatal Error to force fix
          setLessonError(`Security Audit Failed (DEV ONLY): ${audits[0].reason}`);
        } else {
          // PLAYER MODE: Auto-skip broken lesson
          console.warn(`Lesson ${lesson.id} is broken. Skipping for player safety.`);
          // Find next valid lesson
          const currentIndex = LESSONS.findIndex(l => l.id === lesson.id);
          const nextSafe = LESSONS.slice(currentIndex + 1).find(l => ChessValidator.sanityCheckLesson(l).length === 0);

          if (nextSafe) {
            navigate(`/games/chess/learn/${nextSafe.id}`, { replace: true });
          } else {
            navigate('/games/chess/learn', { replace: true });
          }
        }
      }
    }
  }, [lessonId, lesson, navigate]);

  // Load progress from Supabase
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !lesson) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('chess_tutorial_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (data?.completed) {
        setAlreadyCompleted(true);
      }
      setIsLoading(false);
    };

    loadProgress();
  }, [user, lesson]);

  const resetLesson = useCallback(() => {
    if (!lesson) return;
    setBoard(cloneBoard(lesson.board));
    setSelectedSquare(null);
    setLegalMoves([]);
    setFeedback(null);
    setShowHint(false);
    setIsCompleted(false);
    setLastMove(null);
    setMoveCount(0);
    setShowIntro(true);
    setIllegalMoveMessage(null);
  }, [lesson]);

  const completeLesson = useCallback(async () => {
    if (!user || !lesson) return;

    setIsCompleted(true);
    playSound('success');

    // Persist completion (NO COINS in Learn mode)
    await supabase
      .from('chess_tutorial_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lesson.id,
        completed: true,
        completed_at: new Date().toISOString(),
      });
  }, [user, lesson, playSound]);


  const handleMoveResult = useCallback((move: Move, isAccepted: boolean) => {
    if (!lesson || lessonError) return;

    // 1. Core Rule & Geometry Validation (The Single Source of Truth)
    const ruleValidation = ChessValidator.validateCoreRules(board, move, lesson.playerColor);
    if (!ruleValidation.valid) {
      playSound('failure');
      setFeedback({ type: 'error', message: 'Illegal Move' });
      setIllegalMoveMessage(ruleValidation.message ?? 'That move violates the laws of chess.');
      setTimeout(() => {
        // Only reset if it was disjoint from current state, but typically we let them retry
        // If we reset, they lose context. Better to just clear selection.
        setIllegalMoveMessage(null);
        setFeedback(null);
        setBoard(cloneBoard(board)); // Revert any ghost state if needed
      }, 2000);
      return;
    }

    // 2. Lesson Constraints
    const constraintValidation = ChessValidator.validateLessonConstraints(lesson, move);
    if (!constraintValidation.valid) {
      playSound('failure');
      setFeedback({ type: 'error', message: 'Lesson failed' });
      setIllegalMoveMessage(constraintValidation.message ?? 'This move is not allowed in this lesson.');
      setTimeout(() => setIllegalMoveMessage(null), 2000);
      return;
    }

    // 3. Check Sequence (if defined)
    let validSequence = true;
    if (lesson.moveSequence && lesson.moveSequence.length > 0) {
      const expectedMove = lesson.moveSequence[moveCount];
      // Check if current move matches expectation
      if (!expectedMove || !moveMatchesAccepted(move, expectedMove)) {
        validSequence = false;
      }
    } else {
      // If no sequence, we rely on constraints/objective logic below
      // But if 'isAccepted' was passed as false (from specific mode check), we fail here
      // UNLESS it's Explore mode
      if (lesson.mode === 'specific' && !isAccepted) {
        validSequence = false;
      }
    }

    if (!validSequence) {
      playSound('failure');
      const customFail = lesson.failureMessages?.[getMoveNotation(move)];
      setFeedback({ type: 'error', message: lesson.hint });
      setIllegalMoveMessage(customFail ?? lesson.illegalMoveExplanation ?? 'That is not the correct move for this lesson.');
      setTimeout(() => resetLesson(), 1500);
      return;
    }

    // 4. Executes Valid Move
    const newBoard = makeMove(board, move);
    setBoard(newBoard);
    setLastMove({ from: move.from, to: move.to });
    const newMoveCount = moveCount + 1;
    setMoveCount(newMoveCount);
    playSound('move');

    // 5. Check Objective Completion
    const objective = lesson.objective;
    let objectiveMet = false;

    if (lesson.moveSequence && lesson.moveSequence.length > 0) {
      if (newMoveCount >= lesson.moveSequence.length) {
        objectiveMet = true;
      }
    } else {
      switch (objective.type) {
        case 'make-move':
          objectiveMet = true;
          break;
        case 'capture':
          objectiveMet = !!move.captured;
          break;
        case 'check':
          objectiveMet = isInCheck(newBoard, lesson.playerColor === 'white' ? 'black' : 'white');
          break;
        case 'checkmate':
          const state = getGameState(newBoard, lesson.playerColor === 'white' ? 'black' : 'white');
          objectiveMet = state === 'checkmate';
          break;
        case 'castle':
          objectiveMet = !!move.isCastling;
          break;
        case 'promote':
          objectiveMet = !!move.promotion;
          break;
        default:
          objectiveMet = true;
      }
    }

    if (objectiveMet) {
      setFeedback({ type: 'success', message: lesson.successMessage });
      setTimeout(() => {
        void completeLesson();
      }, 500);
    } else {
      setFeedback({ type: 'info', message: 'Good move! Continue...' });
    }

    setSelectedSquare(null);
    setLegalMoves([]);

  }, [board, lesson, playSound, completeLesson, resetLesson, moveCount, lessonError]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!lesson || isCompleted) return;

    // Handle click-type objectives
    if (lesson.objective.type === 'click' && lesson.objective.targetSquare) {
      const target = lesson.objective.targetSquare;
      if (row === target.row && col === target.col) {
        setFeedback({ type: 'success', message: lesson.successMessage });
        void completeLesson();
      } else {
        playSound('failure');
        setFeedback({ type: 'error', message: lesson.hint });
      }
      return;
    }

    const clickedPiece = board[row]?.[col] ?? null;

    // If we already have a selection, try to make a move
    if (selectedSquare) {
      const move = legalMoves.find(m => m.to.row === row && m.to.col === col);

      if (move) {
        // Check if this is a valid move for the lesson
        if (lesson.mode === 'specific' && lesson.objective.acceptedMoves) {
          // If moveSequence exists, handleMoveResult will ignore isAccepted flag passed here and checks sequence
          const isAccepted = lesson.objective.acceptedMoves.some(accepted =>
            moveMatchesAccepted(move, accepted)
          );
          handleMoveResult(move, isAccepted);
        } else {
          // Explore mode - any legal move is accepted
          handleMoveResult(move, true);
        }
        return;
      }

      // Clicked elsewhere - clear selection or select new piece
      if (clickedPiece && clickedPiece.color === lesson.playerColor) {
        // Select new piece if allowed
        if (lesson.allowedPieces.length === 0 || lesson.allowedPieces.includes(clickedPiece.type)) {
          selectPiece(row, col);
        } else {
          playSound('failure');
          setIllegalMoveMessage(`In this lesson, you can only move: ${lesson.allowedPieces.join(', ')}`);
          setTimeout(() => setIllegalMoveMessage(null), 2000);
        }
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
      return;
    }

    // No selection - try to select a piece
    if (clickedPiece && clickedPiece.color === lesson.playerColor) {
      // Check if piece type is allowed
      if (lesson.allowedPieces.length > 0 && !lesson.allowedPieces.includes(clickedPiece.type)) {
        playSound('failure');
        setIllegalMoveMessage(`In this lesson, you can only move: ${lesson.allowedPieces.join(', ')}`);
        setTimeout(() => setIllegalMoveMessage(null), 2000);
        return;
      }

      selectPiece(row, col);
    }
  }, [board, lesson, selectedSquare, legalMoves, isCompleted, playSound, handleMoveResult, completeLesson]);

  const selectPiece = useCallback((row: number, col: number) => {
    if (!lesson) return;

    playSound('click');
    setFeedback(null);
    setIllegalMoveMessage(null);
    setSelectedSquare({ row, col });

    // Get ALL legal moves for this piece
    const allMoves = getLegalMoves(board, lesson.playerColor);
    const pieceMoves = allMoves.filter(m => m.from.row === row && m.from.col === col);

    // In explore mode, show all legal moves
    // In specific mode, still show all legal moves (but only accept specific ones)
    setLegalMoves(pieceMoves);
  }, [board, lesson, playSound]);

  // Loading states
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
          <p className="text-muted-foreground mb-6">Please sign in to access lessons.</p>
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

  if (!lesson) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Lesson Not Found</h2>
          <button
            onClick={() => navigate('/games/chess/learn')}
            className="px-6 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-all"
          >
            Back to Learning Hub
          </button>
        </div>
      </Layout>
    );
  }

  const currentIndex = LESSONS.findIndex(l => l.id === lesson.id);
  const progress = ((currentIndex + (isCompleted ? 1 : 0)) / LESSONS.length) * 100;

  // Find next SAFE lesson
  const nextLesson = LESSONS.slice(currentIndex + 1).find(l => {
    if (import.meta.env.MODE === 'development') return true;
    return ChessValidator.sanityCheckLesson(l).length === 0;
  }) ?? null;

  // Find previous SAFE lesson
  const prevLesson = [...LESSONS].slice(0, currentIndex).reverse().find(l => {
    if (import.meta.env.MODE === 'development') return true;
    return ChessValidator.sanityCheckLesson(l).length === 0;
  }) ?? null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/games/chess/learn')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Exit
          </button>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-2xl">{lesson.icon}</span>
              <h2 className="font-bold text-foreground">{lesson.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Lesson {lesson.id} of {LESSONS.length} • {lesson.category}
            </p>
          </div>

          <div className="w-[72px]" />
        </div>


        <Progress value={progress} className="h-2 mb-6" />

        {/* Intro Overlay */}
        {showIntro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl mx-auto mb-4">
                  {lesson.icon}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{lesson.title}</h2>
                <p className="text-lg text-primary font-medium mb-4">{lesson.subtitle}</p>
                <div className="p-4 rounded-xl bg-muted/50 text-left">
                  <p className="text-muted-foreground leading-relaxed">{lesson.concept}</p>
                </div>
              </div>
              <button
                onClick={() => setShowIntro(false)}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Start Lesson
              </button>
            </div>
          </div>
        )}



        {/* Error State for Invalid Lessons */}
        {lessonError && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/20 border border-destructive text-destructive flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Lesson Security Audit Failed</h3>
              <p className="text-sm">{lessonError}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Board */}
          <div className="flex-shrink-0">
            <ChessBoard
              board={board}
              theme="classic"
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              onSquareClick={handleSquareClick}
              highlightSquares={lesson.highlightSquares}
              targetSquare={lesson.objective.targetSquare}
              showArrow={lesson.showArrow}
              lastMove={lastMove}
              disabled={isCompleted}
            />
          </div>

          {/* Side panel */}
          <div className="w-full lg:w-96 space-y-4">
            {/* Objective */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <div className="flex items-start gap-3 mb-4">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">{lesson.subtitle}</h3>
                  <p className="text-sm text-muted-foreground">{lesson.objective.description}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-foreground leading-relaxed">{lesson.concept}</p>
              </div>
            </div>

            {/* Illegal Move Warning */}
            {illegalMoveMessage && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/50 flex items-start gap-3 animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm text-warning">{illegalMoveMessage}</p>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div
                className={cn(
                  'p-4 rounded-xl flex items-start gap-3 animate-fade-in',
                  feedback.type === 'success' && 'bg-success/10 border border-success/50',
                  feedback.type === 'error' && 'bg-destructive/10 border border-destructive/50',
                  feedback.type === 'info' && 'bg-primary/10 border border-primary/50'
                )}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                ) : feedback.type === 'error' ? (
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={cn(
                    'text-sm',
                    feedback.type === 'success' && 'text-success',
                    feedback.type === 'error' && 'text-destructive',
                    feedback.type === 'info' && 'text-primary'
                  )}
                >
                  {feedback.message}
                </p>
              </div>
            )}

            {/* Hint */}
            <button
              onClick={() => setShowHint(v => !v)}
              className="w-full p-4 rounded-xl bg-muted hover:bg-muted/80 transition-all flex items-center gap-2"
            >
              <Lightbulb className="w-5 h-5 text-coin" />
              <span className="text-sm">{showHint ? lesson.hint : 'Show Hint'}</span>
            </button>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={resetLesson}
                className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>

              <button
                disabled={!isCompleted || !nextLesson}
                onClick={() => nextLesson && navigate(`/games/chess/learn/${nextLesson.id}`)}
                className={cn(
                  'flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
                  isCompleted && nextLesson
                    ? 'gradient-primary text-primary-foreground hover:opacity-90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
                title={!isCompleted ? 'Complete the lesson first' : !nextLesson ? 'No more lessons' : undefined}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Previous lesson navigation */}
            {prevLesson && (
              <button
                onClick={() => navigate(`/games/chess/learn/${prevLesson.id}`)}
                className="w-full py-2 rounded-xl bg-muted/50 hover:bg-muted/80 transition-all text-sm text-muted-foreground"
              >
                ← Previous: {prevLesson.title}
              </button>
            )}

            {/* Completion notice */}
            {alreadyCompleted && !isCompleted && (
              <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-sm text-success">
                ✓ You've completed this lesson before. Feel free to practice again!
              </div>
            )}

            {/* Mode indicator */}
            <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
              <span className="font-medium">Mode: </span>
              {lesson.mode === 'explore'
                ? 'Explore freely - any legal move will complete the lesson'
                : 'Specific - find the correct move to continue'
              }
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
