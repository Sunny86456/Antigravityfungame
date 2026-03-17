-- =====================================================
-- Migration: dice_rolls audit table for server-side RNG
-- Security Item 1: Cryptographic dice roll tracking
-- =====================================================

-- Dice rolls audit table
CREATE TABLE public.dice_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_id TEXT UNIQUE NOT NULL,  -- Single-use ID for replay prevention
  match_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  dice_value INTEGER NOT NULL CHECK (dice_value >= 1 AND dice_value <= 6),
  consumed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate rolls for same match+turn+user
  UNIQUE(match_id, user_id, turn_number)
);

-- Enable RLS
ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dice rolls"
ON public.dice_rolls
FOR SELECT
USING (auth.uid() = user_id);

-- Only server (via service role) can insert dice rolls
-- No INSERT policy for users - only Edge Functions with service role can insert

-- Rate limiting table for API abuse prevention
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,          -- IP address or session ID
  endpoint TEXT NOT NULL,             -- API endpoint path
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  locked_until TIMESTAMPTZ,           -- Temporary lockout timestamp
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(identifier, endpoint)
);

-- Enable RLS (service role only access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No user policies - only Edge Functions with service role can access

-- Create indexes for performance
CREATE INDEX idx_dice_rolls_match ON public.dice_rolls(match_id);
CREATE INDEX idx_dice_rolls_user ON public.dice_rolls(user_id);
CREATE INDEX idx_dice_rolls_roll_id ON public.dice_rolls(roll_id);
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier, endpoint);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Function to clean up old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - INTERVAL '24 hours'
    AND (locked_until IS NULL OR locked_until < now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
