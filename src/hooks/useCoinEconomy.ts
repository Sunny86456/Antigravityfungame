import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Economy constants
export const ECONOMY = {
  // Ranked Chess Match Fees
  RANKED_MATCH_FEE: {
    easy: 25,
    medium: 50,
    hard: 100
  },
  RANKED_WINNER_MULTIPLIER: 3, // Winner gets 3x the match fee
  
  // DSA Coding Rewards (first completion only)
  DSA_REWARDS: {
    easy: 10,
    medium: 20,
    hard: 30,
    expert: 50
  },
  DSA_FAILED_PENALTY: 5,
  DSA_HINT_COST: {
    basic: 20,
    advanced: 40
  },
  
  // Chess Puzzles
  PUZZLE_UNLOCK_COST: 100,
  PUZZLE_REWARDS: {
    beginner: 10,
    intermediate: 20,
    advanced: 30
  },
  FREE_PUZZLE_COUNT: 3,
  
  // Ads
  AD_REWARD: 50,
  DAILY_AD_LIMIT: 5,
  AD_COOLDOWN_MINUTES: 5,
  
  // Chess Board Skins
  BOARD_TIERS: {
    common: 200,
    rare: 400,
    legendary: 700
  }
} as const;

export type TransactionType = 
  | 'ranked_match_fee'
  | 'ranked_win'
  | 'ranked_loss'
  | 'ranked_draw'
  | 'dsa_completion'
  | 'dsa_failed_attempt'
  | 'dsa_hint'
  | 'puzzle_unlock'
  | 'puzzle_completion'
  | 'tutorial_completion'
  | 'ad_reward'
  | 'board_purchase';

interface TransactionResult {
  success: boolean;
  error?: string;
  newBalance?: number;
}

export function useCoinEconomy() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();

  // Record a coin transaction
  const recordTransaction = useCallback(async (
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string
  ): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount,
        transaction_type: type,
        description,
        reference_id: referenceId
      });

    return !error;
  }, [user]);

  // Process a coin change (update balance + record transaction)
  const processCoinChange = useCallback(async (
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string
  ): Promise<TransactionResult> => {
    if (!user || !profile) {
      return { success: false, error: 'Not authenticated' };
    }

    const currentCoins = profile.coins ?? 0;
    const newBalance = currentCoins + amount;

    // Prevent negative balance
    if (newBalance < 0) {
      return { success: false, error: 'Insufficient coins' };
    }

    // Update profile
    const { error: updateError } = await updateProfile({ coins: newBalance });
    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Record transaction
    await recordTransaction(amount, type, description, referenceId);

    return { success: true, newBalance };
  }, [user, profile, updateProfile, recordTransaction]);

  // Check if user can afford something
  const canAfford = useCallback((cost: number): boolean => {
    return (profile?.coins ?? 0) >= cost;
  }, [profile]);

  // Ranked match fee handling
  const payMatchFee = useCallback(async (
    difficulty: 'easy' | 'medium' | 'hard'
  ): Promise<TransactionResult> => {
    const fee = ECONOMY.RANKED_MATCH_FEE[difficulty];
    return processCoinChange(
      -fee,
      'ranked_match_fee',
      `Ranked ${difficulty} match entry fee`
    );
  }, [processCoinChange]);

  const processRankedWin = useCallback(async (
    difficulty: 'easy' | 'medium' | 'hard',
    matchId?: string
  ): Promise<TransactionResult> => {
    const fee = ECONOMY.RANKED_MATCH_FEE[difficulty];
    const reward = fee * ECONOMY.RANKED_WINNER_MULTIPLIER;
    return processCoinChange(
      reward,
      'ranked_win',
      `Won ranked ${difficulty} match (+${reward} coins)`,
      matchId
    );
  }, [processCoinChange]);

  const processRankedLoss = useCallback(async (
    matchId?: string
  ): Promise<TransactionResult> => {
    // Loser already paid the fee, so no additional change
    await recordTransaction(0, 'ranked_loss', 'Lost ranked match (fee already paid)', matchId);
    return { success: true, newBalance: profile?.coins ?? 0 };
  }, [recordTransaction, profile]);

  const processRankedDraw = useCallback(async (
    difficulty: 'easy' | 'medium' | 'hard',
    matchId?: string
  ): Promise<TransactionResult> => {
    const fee = ECONOMY.RANKED_MATCH_FEE[difficulty];
    return processCoinChange(
      fee, // Refund the fee
      'ranked_draw',
      `Draw in ranked ${difficulty} match (fee refunded)`,
      matchId
    );
  }, [processCoinChange]);

  // DSA game handling
  const processDSACompletion = useCallback(async (
    difficulty: 'easy' | 'medium' | 'hard' | 'expert',
    levelId: number,
    isFirstCompletion: boolean
  ): Promise<TransactionResult> => {
    if (!isFirstCompletion) {
      return { success: true, newBalance: profile?.coins ?? 0 };
    }
    const reward = ECONOMY.DSA_REWARDS[difficulty];
    return processCoinChange(
      reward,
      'dsa_completion',
      `Completed DSA level ${levelId} (${difficulty})`,
      `level_${levelId}`
    );
  }, [processCoinChange, profile]);

  const processDSAFailedAttempt = useCallback(async (
    levelId: number
  ): Promise<TransactionResult> => {
    const currentCoins = profile?.coins ?? 0;
    // Don't penalize if user has less than penalty amount
    if (currentCoins < ECONOMY.DSA_FAILED_PENALTY) {
      return { success: true, newBalance: currentCoins };
    }
    return processCoinChange(
      -ECONOMY.DSA_FAILED_PENALTY,
      'dsa_failed_attempt',
      `Failed attempt on DSA level ${levelId}`,
      `level_${levelId}`
    );
  }, [processCoinChange, profile]);

  // Ad rewards
  const getAdsWatchedToday = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('ads_watched')
      .select('id')
      .eq('user_id', user.id)
      .gte('watched_at', today.toISOString());

    if (error || !data) return 0;
    return data.length;
  }, [user]);

  const getLastAdTime = useCallback(async (): Promise<Date | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('ads_watched')
      .select('watched_at')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return new Date(data.watched_at);
  }, [user]);

  const canWatchAd = useCallback(async (): Promise<{ canWatch: boolean; reason?: string; cooldownMinutes?: number }> => {
    if (!user) return { canWatch: false, reason: 'Not logged in' };

    const adsToday = await getAdsWatchedToday();
    if (adsToday >= ECONOMY.DAILY_AD_LIMIT) {
      return { canWatch: false, reason: `Daily limit reached (${ECONOMY.DAILY_AD_LIMIT}/day)` };
    }

    const lastAd = await getLastAdTime();
    if (lastAd) {
      const cooldownEnd = new Date(lastAd.getTime() + ECONOMY.AD_COOLDOWN_MINUTES * 60 * 1000);
      const now = new Date();
      if (now < cooldownEnd) {
        const remainingMinutes = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 60000);
        return { canWatch: false, reason: 'Cooldown active', cooldownMinutes: remainingMinutes };
      }
    }

    return { canWatch: true };
  }, [user, getAdsWatchedToday, getLastAdTime]);

  const processAdReward = useCallback(async (): Promise<TransactionResult> => {
    if (!user) return { success: false, error: 'Not logged in' };

    const { canWatch, reason } = await canWatchAd();
    if (!canWatch) {
      return { success: false, error: reason };
    }

    // Record ad watched
    await supabase
      .from('ads_watched')
      .insert({ user_id: user.id });

    // Give reward
    return processCoinChange(
      ECONOMY.AD_REWARD,
      'ad_reward',
      `Watched ad (+${ECONOMY.AD_REWARD} coins)`
    );
  }, [user, canWatchAd, processCoinChange]);

  // Get transaction history
  const getTransactionHistory = useCallback(async (limit = 50) => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  }, [user]);

  return {
    // Constants
    ECONOMY,
    
    // State helpers
    canAfford,
    currentBalance: profile?.coins ?? 0,
    
    // Ranked match
    payMatchFee,
    processRankedWin,
    processRankedLoss,
    processRankedDraw,
    
    // DSA
    processDSACompletion,
    processDSAFailedAttempt,
    
    // General
    processCoinChange,
    recordTransaction,
    
    // Ads
    getAdsWatchedToday,
    canWatchAd,
    processAdReward,
    
    // History
    getTransactionHistory,
    
    // Refresh
    refreshProfile
  };
}
