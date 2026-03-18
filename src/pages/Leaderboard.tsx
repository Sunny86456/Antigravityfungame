import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Trophy, Medal, Crown, TrendingUp, Coins, Loader2, Gamepad2, Code2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  coins: number;
  wins: number;
  games_played: number;
  xp: number;
  isCurrentUser?: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Crown className="w-6 h-6 text-coin" />;
    case 2: return <Medal className="w-6 h-6 text-muted-strong" />;
    case 3: return <Medal className="w-6 h-6 text-warning" />;
    default: return <span className="text-lg font-bold text-muted-strong">#{rank}</span>;
  }
};

const getAvatarEmoji = (index: number) => {
  const emojis = ['🎮', '♔', '🧩', '📚', '🧠', '💻', '🎲', '🃏', '⭐', '🦸', '🎯', '🚀'];
  return emojis[index % emojis.length];
};

const tabs = [
  { id: 'overall', label: 'Overall', icon: Trophy },
  { id: 'chess', label: 'Chess', icon: Gamepad2 },
  { id: 'coding', label: 'Coding', icon: Code2 }
];

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overall' | 'chess' | 'coding'>('overall');

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url, coins, wins, games_played, xp')
      .order('coins', { ascending: false })
      .limit(50);

    if (!error && data) {
      const entries: LeaderboardEntry[] = data.map((profile, index) => ({
        rank: index + 1,
        user_id: profile.user_id,
        username: profile.username || 'Player',
        avatar_url: profile.avatar_url,
        coins: profile.coins ?? 0,
        wins: profile.wins ?? 0,
        games_played: profile.games_played ?? 0,
        xp: profile.xp ?? 0,
        isCurrentUser: user?.id === profile.user_id
      }));
      setLeaderboardData(entries);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchLeaderboard())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchLeaderboard]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const top3 = leaderboardData.slice(0, 3);

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <PageHeader
          title="Leaderboard"
          subtitle="Top players across all games — Live updates!"
        />

        {/* ── Tab Selector ─────────────────────────────────── */}
        <div className="flex justify-center gap-2 mb-10 animate-rise delay-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium",
                activeTab === tab.id
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "glass-chip text-muted-strong hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Top 3 Podium with Glow ──────────────────────── */}
        {top3.length >= 3 && (
          <div className="flex justify-center items-end gap-3 sm:gap-5 mb-14 animate-rise delay-2">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-18 h-18 sm:w-20 sm:h-20 rounded-full glass-surface-2 border-4 flex items-center justify-center text-3xl sm:text-4xl mb-2 glow-silver",
                top3[1].isCurrentUser && "ring-2 ring-primary"
              )}>
                {top3[1].avatar_url ? (
                  <img src={top3[1].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : getAvatarEmoji(1)}
              </div>
              <p className="font-bold text-foreground text-sm sm:text-base">{top3[1].username}</p>
              <p className="text-xs text-muted-strong stat-number">{top3[1].coins.toLocaleString()}</p>
              <div className="mt-2 w-20 sm:w-24 h-20 rounded-t-xl glass-surface-1 flex items-center justify-center border-t-2 border-slate-300/20">
                <Medal className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-4">
              <div className={cn(
                "w-22 h-22 sm:w-24 sm:h-24 rounded-full gradient-primary border-4 flex items-center justify-center text-4xl sm:text-5xl mb-2 glow-gold float",
                top3[0].isCurrentUser && "ring-2 ring-white"
              )}>
                {top3[0].avatar_url ? (
                  <img src={top3[0].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : getAvatarEmoji(0)}
              </div>
              <p className="font-bold text-lg text-foreground">{top3[0].username}</p>
              <p className="text-xs text-muted-strong stat-number">{top3[0].coins.toLocaleString()}</p>
              <div className="mt-2 w-24 sm:w-28 h-28 rounded-t-xl gradient-primary flex items-center justify-center glow-primary">
                <Crown className="w-10 h-10 text-coin" />
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-18 h-18 sm:w-20 sm:h-20 rounded-full glass-surface-2 border-4 flex items-center justify-center text-3xl sm:text-4xl mb-2 glow-bronze",
                top3[2].isCurrentUser && "ring-2 ring-primary"
              )}>
                {top3[2].avatar_url ? (
                  <img src={top3[2].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : getAvatarEmoji(2)}
              </div>
              <p className="font-bold text-foreground text-sm sm:text-base">{top3[2].username}</p>
              <p className="text-xs text-muted-strong stat-number">{top3[2].coins.toLocaleString()}</p>
              <div className="mt-2 w-20 sm:w-24 h-16 rounded-t-xl glass-surface-1 flex items-center justify-center border-t-2 border-amber-500/30">
                <Medal className="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>
        )}

        {/* ── Full Leaderboard Table ───────────────────────── */}
        <div className="rounded-2xl glass-surface-2 overflow-hidden animate-rise delay-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-sm font-medium text-muted-strong">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-right">Games</div>
            <div className="col-span-2 text-right">Wins</div>
            <div className="col-span-3 text-right">Coins</div>
          </div>

          {/* Rows */}
          {leaderboardData.length === 0 ? (
            <div className="p-8 text-center text-muted-strong">
              No players yet. Be the first to play!
            </div>
          ) : (
            leaderboardData.map((player, index) => (
              <div
                key={player.user_id}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 items-center transition-all hover:bg-primary/5",
                  index !== leaderboardData.length - 1 && "border-b border-border/50",
                  player.isCurrentUser && "bg-primary/5 border-l-4 border-l-primary"
                )}
              >
                <div className="col-span-1 flex items-center">
                  {getRankIcon(player.rank)}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full glass-surface-1 flex items-center justify-center text-xl overflow-hidden">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : getAvatarEmoji(index)}
                  </div>
                  <div>
                    <p className={cn("font-medium", player.isCurrentUser ? "text-primary" : "text-foreground")}>
                      {player.username}
                      {player.isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-strong">Level {Math.floor((player.xp ?? 0) / 100) + 1}</p>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Gamepad2 className="w-4 h-4 text-muted-strong" />
                    <span className="text-foreground stat-number">{player.games_played}</span>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Trophy className="w-4 h-4 text-coin" />
                    <span className="font-bold text-foreground stat-number">{player.wins}</span>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Coins className="w-4 h-4 text-coin" />
                    <span className="font-bold text-coin stat-number">{player.coins.toLocaleString()}</span>
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
