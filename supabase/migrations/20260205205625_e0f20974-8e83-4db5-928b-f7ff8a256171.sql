-- Chess Tutorial Progress table
CREATE TABLE public.chess_tutorial_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.chess_tutorial_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutorial progress
CREATE POLICY "Users can view their own tutorial progress"
ON public.chess_tutorial_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial progress"
ON public.chess_tutorial_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorial progress"
ON public.chess_tutorial_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Chess Puzzle Unlocks table
CREATE TABLE public.chess_puzzle_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  puzzle_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, puzzle_id)
);

-- Enable RLS
ALTER TABLE public.chess_puzzle_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for puzzle unlocks
CREATE POLICY "Users can view their own puzzle unlocks"
ON public.chess_puzzle_unlocks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own puzzle unlocks"
ON public.chess_puzzle_unlocks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Chess Puzzle Completions table
CREATE TABLE public.chess_puzzle_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  puzzle_id INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  attempts INTEGER DEFAULT 1,
  UNIQUE(user_id, puzzle_id)
);

-- Enable RLS
ALTER TABLE public.chess_puzzle_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for puzzle completions
CREATE POLICY "Users can view their own puzzle completions"
ON public.chess_puzzle_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own puzzle completions"
ON public.chess_puzzle_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own puzzle completions"
ON public.chess_puzzle_completions
FOR UPDATE
USING (auth.uid() = user_id);