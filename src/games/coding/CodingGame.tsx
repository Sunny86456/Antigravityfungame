import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSounds } from '@/shared/hooks/useGameSounds';
import { supabase } from '@/integrations/supabase/client';
import { CodeEditor } from './CodeEditor';
import { codingLevels, Language, getDifficultyColor, getDifficultyBg, CodingLevel } from './levels';
import { 
  Play, 
  Clock, 
  Coins, 
  Lightbulb, 
  ChevronLeft, 
  Trophy,
  CheckCircle,
  XCircle,
  Lock,
  Loader2,
  Code2,
  Zap,
  AlertTriangle,
  Terminal
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type GameState = 'menu' | 'playing' | 'results';

type Verdict = 'accepted' | 'wrong_answer' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded' | 'empty_code';

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  executionTime?: number;
}

interface ExecuteResponse {
  success: boolean;
  verdict: Verdict;
  results: TestResult[];
  compilationError?: string;
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

interface LevelProgress {
  level_id: number;
  completed: boolean;
  best_time_seconds: number | null;
  attempts: number;
}

export default function CodingGame() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { playSound } = useGameSounds();
  
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedLevel, setSelectedLevel] = useState<CodingLevel | null>(null);
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [verdict, setVerdict] = useState<Verdict>('wrong_answer');
  const [passed, setPassed] = useState(false);
  const [progress, setProgress] = useState<LevelProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timerWarning, setTimerWarning] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showFailAnimation, setShowFailAnimation] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  
  const lastWarningTime = useRef(0);

  // Check if code is valid for submission
  useEffect(() => {
    if (!selectedLevel) {
      setCanSubmit(false);
      return;
    }

    const trimmedCode = code.trim();
    
    // Check 1: Code must not be empty
    if (!trimmedCode || trimmedCode.length < 20) {
      setCanSubmit(false);
      return;
    }

    // Check 2: Code must not contain TODO comments (incomplete)
    if (trimmedCode.includes('// TODO') || trimmedCode.includes('# TODO')) {
      setCanSubmit(false);
      return;
    }

    // Check 3: Code must be different from starter code
    const starterCode = selectedLevel.starterCode[language];
    if (trimmedCode === starterCode.trim()) {
      setCanSubmit(false);
      return;
    }

    setCanSubmit(true);
  }, [code, selectedLevel, language]);

  const loadProgress = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('coding_game_progress')
      .select('level_id, completed, best_time_seconds, attempts')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setProgress(data as LevelProgress[]);
    }
    setIsLoading(false);
  }, [user]);

  // Load progress from Supabase
  useEffect(() => {
    if (user) {
      loadProgress();
    } else {
      setIsLoading(false);
    }
  }, [user, loadProgress]);

  const isLevelUnlocked = (levelId: number): boolean => {
    if (levelId === 1) return true;
    const prevLevel = progress.find(p => p.level_id === levelId - 1);
    return prevLevel?.completed || false;
  };

  const isLevelCompleted = (levelId: number): boolean => {
    return progress.find(p => p.level_id === levelId)?.completed || false;
  };

  const startLevel = (level: CodingLevel) => {
    if (!isLevelUnlocked(level.id) && !isLevelCompleted(level.id - 1)) {
      return;
    }
    
    playSound('click');
    setSelectedLevel(level);
    setCode(level.starterCode[language]);
    setTimeLeft(level.timeLimit);
    setHintsUsed(0);
    setShowHint(false);
    setResults([]);
    setVerdict('wrong_answer');
    setGameState('playing');
    setIsRunning(true);
    setIsSubmitting(false);
    setShowSuccessAnimation(false);
    setShowFailAnimation(false);
    setCanSubmit(false);
    lastWarningTime.current = 0;
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (selectedLevel) {
      setCode(selectedLevel.starterCode[newLang]);
    }
  };

  const useHint = async () => {
    if (!selectedLevel || !profile) return;
    
    const hintCost = selectedLevel.hintCost;
    if (profile.coins < hintCost) return;
    
    if (hintsUsed < selectedLevel.hints.length) {
      playSound('click');
      await updateProfile({ coins: profile.coins - hintCost });
      setHintsUsed(prev => prev + 1);
      setShowHint(true);
    }
  };

  const getVerdictDisplay = (v: Verdict) => {
    switch (v) {
      case 'accepted':
        return { icon: CheckCircle, text: 'Accepted', color: 'text-success', bg: 'bg-success/10' };
      case 'wrong_answer':
        return { icon: XCircle, text: 'Wrong Answer', color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'compilation_error':
        return { icon: AlertTriangle, text: 'Compilation Error', color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'runtime_error':
        return { icon: Terminal, text: 'Runtime Error', color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'time_limit_exceeded':
        return { icon: Clock, text: 'Time Limit Exceeded', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      case 'empty_code':
        return { icon: Code2, text: 'Empty or Incomplete Code', color: 'text-muted-strong', bg: 'glass-chip' };
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedLevel || isSubmitting) return;
    
    setIsSubmitting(true);
    setIsRunning(false);
    
    const trimmedCode = code.trim();
    
    // LOCAL VALIDATION 1: Empty code check
    if (!trimmedCode || trimmedCode.length < 20) {
      setVerdict('empty_code');
      setResults([{
        input: 'N/A',
        expected: 'N/A',
        actual: 'Code is empty or too short. Please write your solution.',
        passed: false,
        error: 'empty_code'
      }]);
      setPassed(false);
      playSound('failure');
      setShowFailAnimation(true);
      setGameState('results');
      setIsSubmitting(false);
      return;
    }

    // LOCAL VALIDATION 2: TODO comments still present
    if (trimmedCode.includes('// TODO') || trimmedCode.includes('# TODO')) {
      setVerdict('empty_code');
      setResults([{
        input: 'N/A',
        expected: 'N/A',
        actual: 'Code contains TODO comments. Please complete the solution.',
        passed: false,
        error: 'incomplete_code'
      }]);
      setPassed(false);
      playSound('failure');
      setShowFailAnimation(true);
      setGameState('results');
      setIsSubmitting(false);
      return;
    }

    // LOCAL VALIDATION 3: Code unchanged from starter
    if (trimmedCode === selectedLevel.starterCode[language].trim()) {
      setVerdict('empty_code');
      setResults([{
        input: 'N/A',
        expected: 'N/A',
        actual: 'Code is unchanged from the starter template. Please complete the solution.',
        passed: false,
        error: 'unchanged_code'
      }]);
      setPassed(false);
      playSound('failure');
      setShowFailAnimation(true);
      setGameState('results');
      setIsSubmitting(false);
      return;
    }

    // Prepare test cases for execution
    const testCases = selectedLevel.testCases.map(tc => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput
    }));

    try {
      // Call the edge function for real code execution
      const { data, error } = await supabase.functions.invoke<ExecuteResponse>('execute-code', {
        body: {
          code: trimmedCode,
          language,
          testCases,
          timeoutMs: 5000
        }
      });

      if (error) {
        console.error('Execution error:', error);
        setVerdict('runtime_error');
        setResults([{
          input: 'N/A',
          expected: 'N/A',
          actual: `Server Error: ${error.message}`,
          passed: false,
          error: 'server_error'
        }]);
        setPassed(false);
        playSound('failure');
        setShowFailAnimation(true);
        setGameState('results');
        setIsSubmitting(false);
        return;
      }

      if (!data) {
        throw new Error('No response from execution server');
      }

      // Process execution results
      setVerdict(data.verdict);
      setResults(data.results);
      
      // STRICT CHECK: Only pass if verdict is 'accepted' AND all tests passed
      const isAccepted = data.verdict === 'accepted' && data.allPassed;
      setPassed(isAccepted);

      // Play sounds and animations
      if (isAccepted) {
        playSound('levelComplete');
        setShowSuccessAnimation(true);
      } else {
        playSound('failure');
        setShowFailAnimation(true);
      }

      // Save progress to Supabase
      if (user) {
        const timeTaken = selectedLevel.timeLimit - timeLeft;
        const existingProgress = progress.find(p => p.level_id === selectedLevel.id);
        
        if (isAccepted) {
          // ONLY award coins if ACCEPTED
          const coinReward = selectedLevel.coinReward;
          if (profile && !existingProgress?.completed) {
            await updateProfile({ 
              coins: profile.coins + coinReward,
              xp: (profile.xp ?? 0) + coinReward * 2,
              games_played: (profile.games_played ?? 0) + 1,
              wins: (profile.wins ?? 0) + 1
            });
          }
          
          // Update progress
          if (existingProgress) {
            await supabase
              .from('coding_game_progress')
              .update({
                completed: true,
                best_time_seconds: existingProgress.best_time_seconds 
                  ? Math.min(existingProgress.best_time_seconds, timeTaken)
                  : timeTaken,
                attempts: existingProgress.attempts + 1,
                completed_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('level_id', selectedLevel.id);
          } else {
            await supabase
              .from('coding_game_progress')
              .insert({
                user_id: user.id,
                level_id: selectedLevel.id,
                completed: true,
                best_time_seconds: timeTaken,
                attempts: 1,
                completed_at: new Date().toISOString()
              });
          }
        } else {
          // Only update attempts - NO coins for failure
          if (existingProgress) {
            await supabase
              .from('coding_game_progress')
              .update({ 
                attempts: existingProgress.attempts + 1, 
                last_attempted_at: new Date().toISOString() 
              })
              .eq('user_id', user.id)
              .eq('level_id', selectedLevel.id);
          } else {
            await supabase
              .from('coding_game_progress')
              .insert({
                user_id: user.id,
                level_id: selectedLevel.id,
                completed: false,
                attempts: 1,
                last_attempted_at: new Date().toISOString()
              });
          }
        }
        
        await loadProgress();
      }

    } catch (err) {
      console.error('Submission error:', err);
      setVerdict('runtime_error');
      setResults([{
        input: 'N/A',
        expected: 'N/A',
        actual: `Error: ${err instanceof Error ? err.message : String(err)}`,
        passed: false,
        error: 'execution_error'
      }]);
      setPassed(false);
      playSound('failure');
      setShowFailAnimation(true);
    }
    
    setGameState('results');
    setIsSubmitting(false);
  }, [selectedLevel, code, language, timeLeft, user, profile, progress, playSound, isSubmitting, updateProfile, loadProgress]);

  // Timer effect with warning sounds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          // Warning at 30, 10, 5 seconds
          if ([30, 10, 5].includes(prev) && prev !== lastWarningTime.current) {
            lastWarningTime.current = prev;
            playSound('timerWarning');
            setTimerWarning(true);
            setTimeout(() => setTimerWarning(false), 500);
          }
          
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, playSound, handleSubmit]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const retryLevel = () => {
    if (selectedLevel) {
      startLevel(selectedLevel);
    }
  };

  const nextLevel = () => {
    if (selectedLevel && selectedLevel.id < codingLevels.length) {
      const next = codingLevels.find(l => l.id === selectedLevel.id + 1);
      if (next) {
        startLevel(next);
      }
    } else {
      setGameState('menu');
    }
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
          <Code2 className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to Play</h2>
          <p className="text-muted-strong mb-6">You need to be logged in to save your progress.</p>
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

  // Level Selection Menu
  if (gameState === 'menu') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">DSA Coding Challenge</h1>
              <p className="text-muted-strong">Complete levels to earn coins and master algorithms</p>
            </div>
            <button
              onClick={() => navigate('/games')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-button-secondary text-foreground transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Games
            </button>
          </div>

          {/* Language Selector */}
          <div className="mb-8 p-4 rounded-xl glass-surface-2">
            <p className="text-sm font-medium text-foreground mb-3">Select Language:</p>
            <div className="flex gap-2 flex-wrap">
              {(['javascript', 'python', 'cpp', 'java'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all",
                    language === lang
                      ? "gradient-primary text-primary-foreground"
                      : "glass-button-secondary text-muted-strong hover:text-foreground"
                  )}
                >
                  {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Levels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {codingLevels.map((level, index) => {
              const unlocked = isLevelUnlocked(level.id);
              const completed = isLevelCompleted(level.id);
              const levelProgress = progress.find(p => p.level_id === level.id);
              
              return (
                <div
                  key={level.id}
                  onClick={() => unlocked && startLevel(level)}
                  className={cn(
                    "p-6 rounded-2xl border transition-all animate-scale-in",
                    unlocked
                      ? "glass-surface-2 border-border hover:glow-card cursor-pointer"
                      : "glass-surface-1 border-border/50 opacity-70 cursor-not-allowed"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                        completed ? "bg-success/20 text-success" : "gradient-primary text-primary-foreground"
                      )}>
                        {completed ? <CheckCircle className="w-5 h-5" /> : level.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{level.title}</h3>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full border",
                          getDifficultyBg(level.difficulty),
                          getDifficultyColor(level.difficulty)
                        )}>
                          {level.difficulty.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {!unlocked && <Lock className="w-5 h-5 text-muted-strong" />}
                  </div>
                  
                  <p className="text-sm text-muted-strong mb-4">{level.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-strong flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(level.timeLimit)}
                    </span>
                    <span className="text-coin flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      +{level.coinReward}
                    </span>
                  </div>
                  
                  {levelProgress && (
                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-strong">
                      Attempts: {levelProgress.attempts}
                      {levelProgress.best_time_seconds && (
                        <span className="ml-2">Best: {formatTime(levelProgress.best_time_seconds)}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Layout>
    );
  }

  // Playing State
  if (gameState === 'playing' && selectedLevel) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Level {selectedLevel.id}: {selectedLevel.title}
              </h2>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full border",
                getDifficultyBg(selectedLevel.difficulty),
                getDifficultyColor(selectedLevel.difficulty)
              )}>
                {selectedLevel.category} • {selectedLevel.difficulty.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold transition-all",
                timeLeft < 30 ? "bg-destructive/20 text-destructive" : "glass-chip text-foreground",
                timerWarning && "animate-pulse scale-110"
              )}>
                <Clock className={cn("w-5 h-5", timeLeft < 10 && "animate-ping")} />
                {formatTime(timeLeft)}
              </div>
              
              {/* Coins */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-chip">
                <Coins className="w-5 h-5 text-coin" />
                <span className="font-bold">{profile?.coins ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="p-4 rounded-xl glass-surface-2 mb-4">
            <p className="text-foreground">{selectedLevel.description}</p>
          </div>

          {/* Hint Section */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={useHint}
              disabled={hintsUsed >= selectedLevel.hints.length || (profile?.coins ?? 0) < selectedLevel.hintCost}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                hintsUsed < selectedLevel.hints.length && (profile?.coins ?? 0) >= selectedLevel.hintCost
                  ? "bg-coin/20 text-coin hover:bg-coin/30"
                  : "glass-button-disabled cursor-not-allowed"
              )}
            >
              <Lightbulb className="w-4 h-4" />
              Get Hint ({selectedLevel.hintCost} coins)
            </button>
            
            <span className="text-sm text-muted-strong">
              Hints used: {hintsUsed}/{selectedLevel.hints.length}
            </span>

            {/* Language selector */}
            <div className="ml-auto flex gap-2">
              {(['javascript', 'python', 'cpp', 'java'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                    language === lang
                      ? "bg-primary text-primary-foreground"
                      : "glass-button-secondary text-muted-strong hover:text-foreground"
                  )}
                >
                  {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Hints Display */}
          {showHint && hintsUsed > 0 && (
            <div className="p-4 rounded-xl bg-coin/10 border border-coin/30 mb-4 animate-fade-in">
              <p className="text-sm font-medium text-coin mb-2">Hints:</p>
              <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                {selectedLevel.hints.slice(0, hintsUsed).map((hint, i) => (
                  <li key={i}>{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Code Editor */}
          <CodeEditor
            code={code}
            onChange={setCode}
            language={language}
          />

          {/* Validation Status */}
          {!canSubmit && code.trim().length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <p className="text-sm text-orange-500">
                {code.includes('// TODO') || code.includes('# TODO') 
                  ? 'Complete the TODO sections before submitting.'
                  : code.trim() === selectedLevel.starterCode[language].trim()
                    ? 'Write your solution - code is unchanged from template.'
                    : 'Code appears incomplete. Make sure you have written a valid solution.'}
              </p>
            </div>
          )}

          {/* Test Cases Preview */}
          <div className="mt-4 p-4 rounded-xl glass-chip">
            <p className="text-sm font-medium text-foreground mb-2">
              Test Cases ({selectedLevel.testCases.length} total - ALL must pass):
            </p>
            <div className="space-y-2">
              {selectedLevel.testCases.slice(0, 3).map((tc, i) => (
                <div key={i} className="text-sm text-muted-strong">
                  <span className="font-mono">Input: {tc.input}</span>
                  <span className="mx-2">→</span>
                  <span className="font-mono">Expected: {tc.expectedOutput}</span>
                </div>
              ))}
              {selectedLevel.testCases.length > 3 && (
                <p className="text-xs text-muted-strong italic">
                  + {selectedLevel.testCases.length - 3} hidden test cases
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
              className={cn(
                "flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all",
                isSubmitting || !canSubmit
                  ? "glass-button-disabled cursor-not-allowed"
                  : "gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              {isSubmitting ? 'Executing Code...' : canSubmit ? 'Submit Solution' : 'Complete Code First'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Results State
  if (gameState === 'results' && selectedLevel) {
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const verdictDisplay = getVerdictDisplay(verdict);
    const VerdictIcon = verdictDisplay.icon;
    
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Verdict Header */}
          <div className={cn(
            "text-center mb-8 p-8 rounded-2xl border-2 transition-all",
            passed 
              ? "bg-success/10 border-success" 
              : verdictDisplay.bg + " border-" + verdictDisplay.color.replace('text-', ''),
            showSuccessAnimation && "animate-scale-in",
            showFailAnimation && "animate-shake"
          )}>
            {passed ? (
              <>
                <Trophy className="w-16 h-16 mx-auto mb-4 text-coin animate-bounce" />
                <h2 className="text-3xl font-bold text-success mb-2">Accepted!</h2>
                <p className="text-muted-strong mb-4">All {totalCount} test cases passed!</p>
                <div className="flex items-center justify-center gap-2 text-coin text-xl font-bold">
                  <Coins className="w-6 h-6 animate-pulse" />
                  +{selectedLevel.coinReward} coins earned!
                </div>
              </>
            ) : (
              <>
                <VerdictIcon className={cn("w-16 h-16 mx-auto mb-4", verdictDisplay.color)} />
                <h2 className={cn("text-3xl font-bold mb-2", verdictDisplay.color)}>
                  {verdictDisplay.text}
                </h2>
                <p className="text-muted-strong mb-4">
                  {passedCount}/{totalCount} test cases passed. ALL tests must pass!
                </p>
                <p className="text-sm text-muted-strong">
                  No coins awarded - fix your code and try again!
                </p>
              </>
            )}
          </div>

          {/* Test Results */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-foreground mb-4">Test Results:</h3>
            <div className="space-y-3">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-4 rounded-xl border transition-all animate-fade-in",
                    result.passed
                      ? "bg-success/10 border-success/30"
                      : "bg-destructive/10 border-destructive/30"
                  )}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">
                      Test Case {i + 1}
                      {result.executionTime && (
                          <span className="text-xs text-muted-strong ml-2">
                          ({result.executionTime}ms)
                        </span>
                      )}
                    </span>
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="text-sm font-mono space-y-1">
                    <p><span className="text-muted-strong">Input:</span> {result.input}</p>
                    <p><span className="text-muted-strong">Expected:</span> {result.expected}</p>
                    <p className={result.passed ? "text-success" : "text-destructive"}>
                      <span className="text-muted-strong">Actual:</span> {result.actual}
                    </p>
                    {result.error && (
                      <p className="text-destructive text-xs mt-1">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {passed && selectedLevel.id < codingLevels.length ? (
              <button
                onClick={nextLevel}
                className="px-8 py-3 rounded-xl gradient-primary text-primary-foreground font-bold hover:opacity-90 transition-all glow-primary"
              >
                Next Level
              </button>
            ) : null}
            
            <button
              onClick={retryLevel}
              className={cn(
                "px-8 py-3 rounded-xl font-bold transition-all",
                passed
                  ? "glass-button-secondary text-foreground"
                  : "gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
              )}
            >
              {passed ? 'Retry Level' : 'Try Again'}
            </button>
            
            <button
              onClick={() => setGameState('menu')}
              className="px-8 py-3 rounded-xl glass-button-secondary transition-all text-foreground"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
