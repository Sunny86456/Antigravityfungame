/**
 * Chess Learning Hub
 * 
 * Main navigation for the chess learning system with:
 * - Comprehensive lesson list organized by category
 * - Progress tracking per user
 * - Puzzle and Practice mode access
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LESSONS, LESSON_CATEGORIES, LessonCategory } from './lessonData';
import { ChessValidator } from './ChessValidator';
import { PUZZLES, FREE_PUZZLE_COUNT, PUZZLE_UNLOCK_COST } from './puzzles';
import {
  ChevronLeft,
  BookOpen,
  Puzzle,
  Gamepad2,
  Lock,
  CheckCircle,
  Coins,
  Play,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

type TabType = 'learn' | 'puzzles' | 'practice';

export default function ChessLearningHub() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('learn');
  const [completedTutorials, setCompletedTutorials] = useState<number[]>([]);
  const [unlockedPuzzles, setUnlockedPuzzles] = useState<number[]>([]);
  const [completedPuzzles, setCompletedPuzzles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<LessonCategory | null>('pawn');

  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;

    // Load tutorial progress
    const { data: tutorialData } = await supabase
      .from('chess_tutorial_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true);

    if (tutorialData) {
      setCompletedTutorials(tutorialData.map(t => t.lesson_id));
    }

    // Load puzzle unlocks
    const { data: unlockData } = await supabase
      .from('chess_puzzle_unlocks')
      .select('puzzle_id')
      .eq('user_id', user.id);

    if (unlockData) {
      setUnlockedPuzzles(unlockData.map(u => u.puzzle_id));
    }

    // Load puzzle completions
    const { data: completionData } = await supabase
      .from('chess_puzzle_completions')
      .select('puzzle_id')
      .eq('user_id', user.id);

    if (completionData) {
      setCompletedPuzzles(completionData.map(c => c.puzzle_id));
    }

    setIsLoading(false);
  };


  // Filter lessons based on Audit in Production
  const visibleLessons = useMemo(() => {
    // In strict Dev mode, show all so we can debug them.
    // In Player mode, filter out broken ones.
    const isDev = import.meta.env.MODE === 'development';

    // We sort by ID to ensure linear progression logic works
    const all = [...LESSONS].sort((a, b) => a.id - b.id);

    if (isDev) return all;

    return all.filter(l => {
      const audit = ChessValidator.sanityCheckLesson(l);
      return audit.length === 0;
    });
  }, []);

  // Correctly calculate progress based on VISIBLE lessons (for player perception)
  const tutorialProgress = (completedTutorials.length / visibleLessons.length) * 100;
  const puzzleProgress = (completedPuzzles.length / PUZZLES.length) * 100;

  // Helper to check if a lesson is unlocked based on visible chain
  const isLessonUnlocked = (lessonId: number): boolean => {
    const lessonIndex = visibleLessons.findIndex(l => l.id === lessonId);
    if (lessonIndex === -1) {
      // If hidden/invalid, we generally say false, unless in dev mode where it might be visible
      // But since visibleLessons handles dev mode logic, if it's not in visibleLessons, it's locked/unavailable
      return false;
    }
    if (lessonIndex === 0) return true; // First visible lesson always unlocked

    const prevLesson = visibleLessons[lessonIndex - 1];
    return completedTutorials.includes(prevLesson.id);
  };

  // Group lessons by category
  const lessonsByCategory = useMemo(() => {
    return LESSON_CATEGORIES.map(cat => ({
      ...cat,
      lessons: visibleLessons.filter(l => l.category === cat.id)
    }));
  }, [visibleLessons]);

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
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to Learn</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to track your progress.</p>
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Learn Chess</h1>
            <p className="text-muted-foreground">Master the game from basics to advanced tactics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
              <Coins className="w-5 h-5 text-coin" />
              <span className="font-bold">{profile?.coins ?? 0}</span>
            </div>
            <button
              onClick={() => navigate('/games/chess')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Chess
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'learn', label: 'Learn Chess', icon: BookOpen },
            { id: 'puzzles', label: 'Puzzles', icon: Puzzle },
            { id: 'practice', label: 'Practice', icon: Gamepad2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Learn Tab */}
        {activeTab === 'learn' && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Your Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedTutorials.length} of {LESSONS.length} lessons completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{Math.round(tutorialProgress)}%</div>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
              <Progress value={tutorialProgress} className="h-3" />
            </div>

            {/* Quick Start */}
            {completedTutorials.length < visibleLessons.length && (
              <div className="p-6 rounded-2xl bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Continue Learning</h3>
                    <p className="text-sm text-muted-foreground">
                      {/* Calculate next lesson dynamically */}
                      {(() => {
                        // Find first uncompleted visible lesson
                        const nextToPlay = visibleLessons.find(l => !completedTutorials.includes(l.id));
                        if (!nextToPlay) return "All lessons completed!";
                        return `Next up: ${nextToPlay.title}`;
                      })()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const nextToPlay = visibleLessons.find(l => !completedTutorials.includes(l.id));
                      if (nextToPlay) navigate(`/games/chess/learn/${nextToPlay.id}`);
                    }}
                    className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Lessons by Category */}
            <div className="space-y-4">
              {lessonsByCategory.map(category => {
                const categoryLessons = category.lessons;
                const completedInCategory = categoryLessons.filter(l => completedTutorials.includes(l.id)).length;
                const isExpanded = expandedCategory === category.id;

                return (
                  <div key={category.id} className="rounded-2xl border border-border overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      className="w-full p-4 bg-card hover:bg-muted/50 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                          {category.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-foreground">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {completedInCategory}/{categoryLessons.length} lessons completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={(completedInCategory / categoryLessons.length) * 100} className="w-24 h-2" />
                        <ChevronRight className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )} />
                      </div>
                    </button>

                    {/* Lessons List */}
                    {isExpanded && (
                      <div className="border-t border-border">
                        {categoryLessons.map((lesson, index) => {
                          const isCompleted = completedTutorials.includes(lesson.id);
                          const isUnlocked = isLessonUnlocked(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => isUnlocked && navigate(`/games/chess/learn/${lesson.id}`)}
                              className={cn(
                                "p-4 flex items-center gap-4 border-b border-border/50 last:border-b-0 transition-all",
                                isCompleted
                                  ? "bg-success/5"
                                  : isUnlocked
                                    ? "bg-card hover:bg-muted/50 cursor-pointer"
                                    : "bg-muted/30 opacity-60 cursor-not-allowed"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                                isCompleted
                                  ? "bg-success/20"
                                  : isUnlocked
                                    ? "bg-primary/20"
                                    : "bg-muted"
                              )}>
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : !isUnlocked ? (
                                  <Lock className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <span>{lesson.icon}</span>
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">#{lesson.id}</span>
                                  <h4 className="font-medium text-foreground">{lesson.title}</h4>
                                  {isCompleted && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                                      Done
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{lesson.description}</p>
                              </div>

                              {isUnlocked && !isCompleted && (
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Puzzles Tab */}
        {activeTab === 'puzzles' && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Puzzle Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedPuzzles.length} of {PUZZLES.length} puzzles solved
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  First {FREE_PUZZLE_COUNT} puzzles are free!
                </div>
              </div>
              <Progress value={puzzleProgress} className="h-3" />
            </div>

            {/* Puzzle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PUZZLES.map((puzzle, index) => {
                const isCompleted = completedPuzzles.includes(puzzle.id);
                const isFree = index < FREE_PUZZLE_COUNT;
                const isUnlocked = isFree || unlockedPuzzles.includes(puzzle.id);
                const canAfford = (profile?.coins ?? 0) >= PUZZLE_UNLOCK_COST;

                return (
                  <div
                    key={puzzle.id}
                    onClick={() => isUnlocked && navigate(`/games/chess/puzzle/${puzzle.id}`)}
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all",
                      isCompleted
                        ? "border-success/50 bg-success/10"
                        : isUnlocked
                          ? "border-border bg-card hover:border-primary cursor-pointer hover:glow-card"
                          : "border-border/50 bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium",
                        puzzle.difficulty === 'beginner' && "bg-success/20 text-success",
                        puzzle.difficulty === 'intermediate' && "bg-warning/20 text-warning",
                        puzzle.difficulty === 'advanced' && "bg-destructive/20 text-destructive"
                      )}>
                        {puzzle.difficulty}
                      </span>

                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : !isUnlocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : null}
                    </div>

                    <h3 className="font-bold text-foreground mb-1">{puzzle.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize mb-3">
                      {puzzle.category.replace('-', ' ')}
                    </p>

                    {isUnlocked ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Coins className="w-4 h-4 text-coin" />
                        <span className="text-coin font-medium">+{puzzle.coinReward}</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/games/chess/puzzle/${puzzle.id}`);
                        }}
                        className={cn(
                          "w-full py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm",
                          canAfford
                            ? "gradient-primary text-primary-foreground hover:opacity-90"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                      >
                        <Coins className="w-4 h-4" />
                        {PUZZLE_UNLOCK_COST} to unlock
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-2xl bg-card border border-border text-center">
              <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Practice Mode</h2>
              <p className="text-muted-foreground mb-6">
                Play against AI without affecting your stats. Perfect for experimenting
                with new strategies and learning from mistakes!
              </p>

              <div className="p-4 rounded-xl bg-muted/50 mb-6">
                <h3 className="font-medium text-foreground mb-2">🛡️ Safe Environment</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ No coins earned or lost</li>
                  <li>✓ No leaderboard impact</li>
                  <li>✓ No win/loss tracking</li>
                  <li>✓ Perfect for learning!</li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/games/chess/practice')}
                className="px-8 py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all glow-primary flex items-center justify-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5" />
                Start Practice Game
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
