import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/PageHeader';
import { GameCard } from '@/components/GameCard';
import { games } from '@/data/games';
import { Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/utils';

const allTags = ['All', 'Playable', 'Multiplayer', 'Single Player', 'Strategy', 'Puzzle', 'Educational', 'AI'];

const Games = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = activeTag === 'All' ||
      (activeTag === 'Playable' ? game.playable : game.tags.includes(activeTag));
    return matchesSearch && matchesTag;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <PageHeader
          title="All Games"
          subtitle="Browse our complete collection of browser games"
        />

        {/* Search and Filter */}
        <div className="mb-10 space-y-4 animate-rise delay-1">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-strong" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl glass-input transition-all"
            />
          </div>

          {/* Filter Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-strong" />
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeTag === tag
                    ? "gradient-primary text-primary-foreground glow-primary"
                    : "glass-chip text-muted-strong hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game, index) => (
            <div
              key={game.id}
              className="animate-rise"
              style={{ animationDelay: `${200 + index * 60}ms` }}
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

        {filteredGames.length === 0 && (
          <div className="text-center py-16 rounded-2xl glass-surface-1">
            <p className="text-xl text-muted-strong">No games found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Games;
