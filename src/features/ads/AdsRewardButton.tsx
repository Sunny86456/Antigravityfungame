import { useState, useEffect, useCallback } from 'react';
import { useCoinEconomy, ECONOMY } from '@/features/economy/useCoinEconomy';
import { useGameSounds } from '@/shared/hooks/useGameSounds';
import { Play, Coins, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface AdsRewardButtonProps {
  onRewardClaimed?: (amount: number) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export function AdsRewardButton({ onRewardClaimed, className, variant = 'default' }: AdsRewardButtonProps) {
  const { canWatchAd, processAdReward, getAdsWatchedToday } = useCoinEconomy();
  const { playSound } = useGameSounds();
  
  const [isLoading, setIsLoading] = useState(false);
  const [canWatch, setCanWatch] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [cooldown, setCooldown] = useState(0);
  const [adsToday, setAdsToday] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const checkCanWatch = useCallback(async () => {
    const result = await canWatchAd();
    setCanWatch(result.canWatch);
    setReason(result.reason || '');
    setCooldown(result.cooldownMinutes || 0);
    
    const watched = await getAdsWatchedToday();
    setAdsToday(watched);
  }, [canWatchAd, getAdsWatchedToday]);
  
  useEffect(() => {
    checkCanWatch();
    const interval = setInterval(checkCanWatch, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkCanWatch]);
  
  const handleWatchAd = async () => {
    if (!canWatch || isLoading) return;
    
    setIsLoading(true);
    
    // Simulate ad watching (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await processAdReward();
    
    if (result.success) {
      playSound('success');
      setShowSuccess(true);
      onRewardClaimed?.(ECONOMY.AD_REWARD);
      setTimeout(() => setShowSuccess(false), 2000);
    } else {
      playSound('failure');
    }
    
    await checkCanWatch();
    setIsLoading(false);
  };
  
  if (variant === 'compact') {
    return (
      <button
        onClick={handleWatchAd}
        disabled={!canWatch || isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
          canWatch && !isLoading
            ? "bg-success/20 text-success hover:bg-success/30"
            : "bg-muted text-muted-foreground cursor-not-allowed",
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Watching...
          </>
        ) : showSuccess ? (
          <>
            <CheckCircle className="w-4 h-4" />
            +{ECONOMY.AD_REWARD}
          </>
        ) : cooldown > 0 ? (
          <>
            <Clock className="w-4 h-4" />
            {cooldown}m
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <Coins className="w-4 h-4" />
            +{ECONOMY.AD_REWARD}
          </>
        )}
      </button>
    );
  }
  
  return (
    <div className={cn("p-4 rounded-2xl bg-card border border-border", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground">Watch Ad for Coins</h3>
        <div className="text-sm text-muted-foreground">
          {adsToday}/{ECONOMY.DAILY_AD_LIMIT} today
        </div>
      </div>
      
      <button
        onClick={handleWatchAd}
        disabled={!canWatch || isLoading}
        className={cn(
          "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
          canWatch && !isLoading
            ? "gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Watching Ad...
          </>
        ) : showSuccess ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Claimed +{ECONOMY.AD_REWARD} Coins!
          </>
        ) : !canWatch ? (
          <>
            <Clock className="w-5 h-5" />
            {reason}
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Watch Ad
            <Coins className="w-5 h-5" />
            +{ECONOMY.AD_REWARD}
          </>
        )}
      </button>
      
      {cooldown > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Next ad available in {cooldown} minute{cooldown !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
