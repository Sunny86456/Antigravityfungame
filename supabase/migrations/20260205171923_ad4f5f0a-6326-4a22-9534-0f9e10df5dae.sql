-- Coding game progress table
CREATE TABLE public.coding_game_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  best_time_seconds INTEGER,
  attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, level_id)
);

-- Chess game results table
CREATE TABLE public.chess_game_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_type TEXT NOT NULL CHECK (opponent_type IN ('ai', 'local', 'online')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  moves_count INTEGER,
  duration_seconds INTEGER,
  board_theme TEXT DEFAULT 'classic',
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unlocked chess boards table
CREATE TABLE public.unlocked_chess_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, board_id)
);

-- Enable RLS on all tables
ALTER TABLE public.coding_game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chess_game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_chess_boards ENABLE ROW LEVEL SECURITY;

-- RLS policies for coding_game_progress
CREATE POLICY "Users can view their own coding progress" 
ON public.coding_game_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coding progress" 
ON public.coding_game_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coding progress" 
ON public.coding_game_progress FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for chess_game_results
CREATE POLICY "Users can view their own chess results" 
ON public.chess_game_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chess results" 
ON public.chess_game_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for unlocked_chess_boards
CREATE POLICY "Users can view their own unlocked boards" 
ON public.unlocked_chess_boards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocked boards" 
ON public.unlocked_chess_boards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_coding_progress_user ON public.coding_game_progress(user_id);
CREATE INDEX idx_chess_results_user ON public.chess_game_results(user_id);
CREATE INDEX idx_unlocked_boards_user ON public.unlocked_chess_boards(user_id);