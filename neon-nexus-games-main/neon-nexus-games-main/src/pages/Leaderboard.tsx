import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { Trophy, Medal, Crown, TrendingUp, Coins, Loader2, Gamepad2, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    case 2: return <Medal className="w-6 h-6 text-muted-foreground" />;
    case 3: return <Medal className="w-6 h-6 text-warning" />;
    default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getAvatarEmoji = (index: number) => {
  const emojis = ['🎮', '♔', '🧩', '📚', '🧠', '💻', '🎲', '🃏', '⭐', '🦸', '🎯', '🚀'];
  return emojis[index % emojis.length];
};

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overall' | 'chess' | 'coding'>('overall');

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
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
        username: profile.username || `Player ${index + 1}`,
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
  };

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchLeaderboard();
    
    // Subscribe to realtime updates on profiles table
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          // Refetch leaderboard when any profile changes
          fetchLeaderboard();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
          subtitle="Top players across all games - Live updates!" 
        />

        {/* Tab Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: 'overall', label: 'Overall', icon: Trophy },
            { id: 'chess', label: 'Chess', icon: Gamepad2 },
            { id: 'coding', label: 'Coding', icon: Code2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                activeTab === tab.id
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {top3.length >= 3 && (
          <div className="flex justify-center items-end gap-4 mb-12 animate-fade-in">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-20 h-20 rounded-full bg-card border-4 border-muted-foreground flex items-center justify-center text-4xl mb-2 glow-card",
                top3[1].isCurrentUser && "ring-2 ring-primary"
              )}>
                {top3[1].avatar_url ? (
                  <img src={top3[1].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getAvatarEmoji(1)
                )}
              </div>
              <p className="font-bold text-foreground">{top3[1].username}</p>
              <p className="text-sm text-muted-foreground">{top3[1].coins.toLocaleString()}</p>
              <div className="mt-2 w-24 h-20 rounded-t-lg bg-muted border border-border flex items-center justify-center">
                <Medal className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-24 h-24 rounded-full gradient-primary border-4 border-coin flex items-center justify-center text-5xl mb-2 glow-primary float",
                top3[0].isCurrentUser && "ring-2 ring-white"
              )}>
                {top3[0].avatar_url ? (
                  <img src={top3[0].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getAvatarEmoji(0)
                )}
              </div>
              <p className="font-bold text-lg text-foreground">{top3[0].username}</p>
              <p className="text-sm text-muted-foreground">{top3[0].coins.toLocaleString()}</p>
              <div className="mt-2 w-28 h-28 rounded-t-lg gradient-primary flex items-center justify-center glow-primary">
                <Crown className="w-10 h-10 text-coin" />
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-20 h-20 rounded-full bg-card border-4 border-warning flex items-center justify-center text-4xl mb-2 glow-card",
                top3[2].isCurrentUser && "ring-2 ring-primary"
              )}>
                {top3[2].avatar_url ? (
                  <img src={top3[2].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getAvatarEmoji(2)
                )}
              </div>
              <p className="font-bold text-foreground">{top3[2].username}</p>
              <p className="text-sm text-muted-foreground">{top3[2].coins.toLocaleString()}</p>
              <div className="mt-2 w-24 h-16 rounded-t-lg bg-warning/20 border border-warning/50 flex items-center justify-center">
                <Medal className="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden glow-card animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-right">Games</div>
            <div className="col-span-2 text-right">Wins</div>
            <div className="col-span-3 text-right">Coins</div>
          </div>

          {/* Rows */}
          {leaderboardData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No players yet. Be the first to play!
            </div>
          ) : (
            leaderboardData.map((player, index) => (
              <div 
                key={player.user_id}
                className={cn(
                  "grid grid-cols-12 gap-4 p-4 items-center transition-all hover:bg-muted/30",
                  index !== leaderboardData.length - 1 && "border-b border-border",
                  player.isCurrentUser && "bg-primary/5 border-l-4 border-l-primary"
                )}
              >
                <div className="col-span-1 flex items-center">
                  {getRankIcon(player.rank)}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl overflow-hidden">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getAvatarEmoji(index)
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      player.isCurrentUser ? "text-primary" : "text-foreground"
                    )}>
                      {player.username}
                      {player.isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Level {Math.floor((player.xp ?? 0) / 100) + 1}</p>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{player.games_played}</span>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Trophy className="w-4 h-4 text-coin" />
                    <span className="font-bold text-foreground">{player.wins}</span>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Coins className="w-4 h-4 text-coin" />
                    <span className="font-bold text-coin">{player.coins.toLocaleString()}</span>
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
