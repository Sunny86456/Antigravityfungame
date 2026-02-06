import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { GameCard } from '@/components/GameCard';
import { games, featuredGames } from '@/data/games';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';

const Index = () => {
  const regularGames = games.filter(g => !g.featured).slice(0, 4);

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="relative mb-12 py-8">
          <div className="absolute inset-0 bg-gradient-radial opacity-50 pointer-events-none" />
          
          <div className="relative text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Welcome to FunGameForYou</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text neon-text">Play, Compete,</span>
              <br />
              <span className="text-foreground">Win Big!</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Discover amazing browser games, climb the leaderboards, and earn coins. 
              Your next gaming adventure awaits!
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">6+</p>
                  <p className="text-sm text-muted-foreground">Games</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">1K+</p>
                  <p className="text-sm text-muted-foreground">Players</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Games */}
        <section className="mb-12">
          <PageHeader 
            title="Featured Games" 
            subtitle="Our most popular picks for you" 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredGames.map((game, index) => (
              <div 
                key={game.id} 
                className="animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
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

        {/* More Games */}
        <section>
          <PageHeader 
            title="More Games" 
            subtitle="Explore our collection" 
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {regularGames.map((game, index) => (
              <div 
                key={game.id} 
                className="animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
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
