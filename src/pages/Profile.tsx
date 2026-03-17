import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Trophy,
  Coins,
  Calendar,
  Gamepad2,
  Target,
  Clock,
  Medal,
  Star,
  TrendingUp,
  Loader2,
  LogOut
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';

const achievements = [
  { icon: Medal, title: 'First Win', description: 'Won your first game', unlocked: true },
  { icon: Star, title: 'Rising Star', description: 'Reached top 100', unlocked: true },
  { icon: Trophy, title: 'Champion', description: 'Win 50 games', unlocked: false },
  { icon: TrendingUp, title: 'On Fire', description: 'Win 5 games in a row', unlocked: false },
];

const Profile = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const winRate = profile.games_played > 0
    ? Math.round((profile.wins / profile.games_played) * 100)
    : 0;

  const xpForNextLevel = profile.level * 1000;
  const xpProgress = (profile.xp % 1000) / 10;

  const stats = [
    { icon: Gamepad2, label: 'Games Played', value: profile.games_played.toString(), color: 'text-primary' },
    { icon: Trophy, label: 'Wins', value: profile.wins.toString(), color: 'text-coin' },
    { icon: Target, label: 'Win Rate', value: `${winRate}%`, color: 'text-success' },
    { icon: Clock, label: 'Hours Played', value: `${profile.hours_played}h`, color: 'text-accent' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="relative mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-card border border-border glow-card">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center glow-primary">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-primary-foreground" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success flex items-center justify-center border-4 border-card">
                <span className="text-xs font-bold text-primary-foreground">{profile.level}</span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {profile.username || 'Player'}
              </h2>
              {/* IMPORTANT: Never expose user.email outside Account/Settings */}
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-coin" />
                  {profile.coins.toLocaleString()} Coins
                </span>
              </div>
            </div>

            {/* Level Progress */}
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Level Progress</p>
              <div className="w-48 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.xp % 1000} / 1000 XP
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="mb-8">
          <PageHeader title="Statistics" subtitle="Your gaming performance" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-card border border-border glow-card animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <stat.icon className={cn("w-8 h-8 mb-3", stat.color)} />
                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-8">
          <PageHeader title="Achievements" subtitle="Unlock rewards as you play" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.title}
                className={cn(
                  "p-6 rounded-2xl border transition-all animate-scale-in",
                  achievement.unlocked
                    ? "bg-card border-primary/30 glow-card"
                    : "bg-muted/30 border-border opacity-60"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <achievement.icon className={cn(
                  "w-10 h-10 mb-3",
                  achievement.unlocked ? "text-coin" : "text-muted-foreground"
                )} />
                <p className="font-bold text-foreground">{achievement.title}</p>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Profile;
