import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { GameCard } from '@/components/GameCard';
import { games, featuredGames } from '@/data/games';
import { Sparkles, TrendingUp, Users, Trophy } from 'lucide-react';

const stats = [
  { icon: TrendingUp, label: 'Games', value: '6+', color: 'text-primary', tint: 'from-primary/20 to-primary/5' },
  { icon: Users, label: 'Players', value: '1K+', color: 'text-accent', tint: 'from-accent/20 to-accent/5' },
  { icon: Trophy, label: 'Matches', value: '5K+', color: 'text-coin', tint: 'from-amber-400/20 to-amber-400/5' },
];

const Index = () => {
  const regularGames = games.filter(g => !g.featured).slice(0, 4);

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* ── Hero Section ──────────────────────────────────── */}
        <div className="relative mb-16 py-10 md:py-16">
          <div className="relative text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-surface-1 mb-8 animate-rise">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Welcome to FunGameForYou</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight animate-rise delay-1">
              <span className="gradient-text neon-text">Play, Compete,</span>
              <br />
              <span className="text-foreground">Win Big!</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-strong mb-10 max-w-2xl mx-auto leading-relaxed animate-rise delay-2">
              Discover amazing browser games, climb the leaderboards, and earn coins.
              Your next gaming adventure awaits!
            </p>

            {/* ── Stats Bento Cards ───────────────────────────── */}
            <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap animate-rise delay-3">
              {stats.map(({ icon: Icon, label, value, color, tint }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl glass-surface-2 min-w-[152px]"
                >
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${tint} border border-primary/10`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-foreground stat-number">{value}</p>
                    <p className="text-xs text-muted-strong">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Featured Games — Bento Grid ────────────────────── */}
        <section className="mb-16">
          <PageHeader
            title="Featured Games"
            subtitle="Our most popular picks for you"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredGames.map((game, index) => (
              <div
                key={game.id}
                className="animate-rise"
                style={{ animationDelay: `${150 + index * 100}ms` }}
              >
                <GameCard
                  title={game.title}
                  description={game.description}
                  icon={<game.icon className="w-8 h-8 text-primary-foreground" />}
                  tags={game.tags}
                  featured
                  playable={game.playable}
                  route={game.route}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── More Games ─────────────────────────────────────── */}
        <section className="mb-8">
          <PageHeader
            title="More Games"
            subtitle="Explore our collection"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularGames.map((game, index) => (
              <div
                key={game.id}
                className="animate-rise"
                style={{ animationDelay: `${200 + index * 75}ms` }}
              >
                <GameCard
                  title={game.title}
                  description={game.description}
                  icon={<game.icon className="w-8 h-8 text-primary-foreground" />}
                  tags={game.tags}
                  playable={game.playable}
                  route={game.route}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
