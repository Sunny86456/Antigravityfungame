-- Coin Transactions table for tracking all coin movements
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
ON public.coin_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.coin_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created_at ON public.coin_transactions(created_at DESC);

-- Ads watched table for daily limit tracking
CREATE TABLE public.ads_watched (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads_watched ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own ads history"
ON public.ads_watched
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ads watched"
ON public.ads_watched
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster daily count queries
CREATE INDEX idx_ads_watched_user_date ON public.ads_watched(user_id, watched_at);

-- Ranked match rate limiting table
CREATE TABLE public.ranked_match_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  opponent_id UUID,
  match_fee INTEGER NOT NULL,
  result TEXT NOT NULL,
  coins_gained INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ranked_match_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own match history"
ON public.ranked_match_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own match history"
ON public.ranked_match_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for rate limiting queries
CREATE INDEX idx_ranked_match_history_user_played ON public.ranked_match_history(user_id, played_at DESC);