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
  cloneBoard
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
  AlertTriangle
} from 'lucide-react';

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
  const [illegalMoveMessage, setIllegalMoveMessage] = useState<string | null>(null);

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
    setMoveCount(0);
    setIllegalMoveMessage(null);
  }, [lessonId, lesson]);

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
    if (!lesson) return;

    if (isAccepted) {
      // Valid move - apply it
      const newBoard = makeMove(board, move);
      setBoard(newBoard);
      setLastMove({ from: move.from, to: move.to });
      setMoveCount(prev => prev + 1);
      playSound('move');

      // Check if lesson objective is met
      const objective = lesson.objective;
      let objectiveMet = false;

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

      if (objectiveMet) {
        setFeedback({ type: 'success', message: lesson.successMessage });
        setTimeout(() => {
          void completeLesson();
        }, 500);
      } else {
        setFeedback({ type: 'info', message: 'Good move! Keep going to complete the objective.' });
      }
    } else {
      // Invalid move in specific mode
      playSound('failure');
      setFeedback({ type: 'error', message: lesson.hint });
      setIllegalMoveMessage(lesson.illegalMoveExplanation || 'That move does not complete the objective.');
      
      // Reset after showing feedback
      setTimeout(() => {
        resetLesson();
      }, 1500);
    }

    setSelectedSquare(null);
    setLegalMoves([]);
  }, [board, lesson, playSound, completeLesson, resetLesson]);

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
  const nextLesson = LESSONS[currentIndex + 1] ?? null;
  const prevLesson = LESSONS[currentIndex - 1] ?? null;

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
