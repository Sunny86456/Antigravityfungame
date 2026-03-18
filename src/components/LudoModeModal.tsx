import { useState, useEffect } from 'react';
import { X, Users, User, Tv, ShoppingBag, Trophy } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { PlayerType } from '@/games/ludo/engine/types';

interface LudoModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartGame: () => void;
}

export function LudoModeModal({ isOpen, onClose, onStartGame }: LudoModeModalProps) {
    const [playerCount, setPlayerCount] = useState<number>(2);
    const [gameMode, setGameMode] = useState<'LOCAL' | 'VS_CPU'>('VS_CPU');

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setPlayerCount(2);
            setGameMode('VS_CPU');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleStartGame = () => {
        // Generate config based on selection
        const players = [];

        // Player 1 is always HUMAN (You)
        players.push({ id: 'p1', name: 'You', type: PlayerType.HUMAN, color: 'RED' });

        // Generate other players
        for (let i = 1; i < playerCount; i++) {
            const isCpu = gameMode === 'VS_CPU';
            players.push({
                id: `p${i + 1}`,
                name: isCpu ? `Bot ${i}` : `Player ${i + 1}`,
                type: isCpu ? PlayerType.AI : PlayerType.HUMAN,
                color: ['GREEN', 'YELLOW', 'BLUE'][i - 1] // Simple color assignment
            });
        }

        // Set global config
        // @ts-expect-error - External library types mismatch
        window.__LUDO_CONFIG__ = {
            mode: gameMode,
            players
        };

        // Start game
        onStartGame();

        // Close modal
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl glass-surface-3 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold gradient-text neon-text">
                        Ludo Game Setup
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full glass-chip hover:scale-105 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 space-y-8 overflow-y-auto">

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Play Modes */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Tv className="w-5 h-5 text-primary" /> Play Now
                            </h3>

                            {/* VS CPU */}
                            <div className={cn(
                                "p-4 rounded-xl border-2 transition-all cursor-pointer",
                                gameMode === 'VS_CPU'
                                    ? "border-primary glass-surface-2 glow-card"
                                    : "glass-surface-1 hover:border-primary/30"
                            )} onClick={() => setGameMode('VS_CPU')}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold">Play vs AI</span>
                                    {gameMode === 'VS_CPU' && <div className="w-3 h-3 rounded-full bg-primary" />}
                                </div>
                                <div className="flex gap-2">
                                    {[2, 3, 4].map(count => (
                                        <button
                                            key={`cpu-${count}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setGameMode('VS_CPU');
                                                setPlayerCount(count);
                                            }}
                                            className={cn(
                                                "flex-1 py-1.5 text-sm rounded-lg font-medium transition-all",
                                                gameMode === 'VS_CPU' && playerCount === count
                                                    ? "bg-primary text-primary-foreground glow-primary"
                                                    : "glass-chip text-muted-strong hover:text-foreground"
                                            )}
                                        >
                                            {count}P
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Local Multiplayer */}
                            <div className={cn(
                                "p-4 rounded-xl border-2 transition-all cursor-pointer",
                                gameMode === 'LOCAL'
                                    ? "border-primary glass-surface-2 glow-card"
                                    : "glass-surface-1 hover:border-primary/30"
                            )} onClick={() => setGameMode('LOCAL')}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold">Local Multiplayer</span>
                                    {gameMode === 'LOCAL' && <div className="w-3 h-3 rounded-full bg-primary" />}
                                </div>
                                <div className="flex gap-2">
                                    {[2, 3, 4].map(count => (
                                        <button
                                            key={`local-${count}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setGameMode('LOCAL');
                                                setPlayerCount(count);
                                            }}
                                            className={cn(
                                                "flex-1 py-1.5 text-sm rounded-lg font-medium transition-all",
                                                gameMode === 'LOCAL' && playerCount === count
                                                    ? "bg-primary text-primary-foreground glow-primary"
                                                    : "glass-chip text-muted-strong hover:text-foreground"
                                            )}
                                        >
                                            {count}P
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Coming Soon */}
                        <div className="space-y-6 opacity-60">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-coin" /> Ranked & Shop
                            </h3>

                            {/* Ranked */}
                            <div className="p-4 rounded-xl glass-surface-1 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-background/45 backdrop-blur-[2px] flex items-center justify-center z-10">
                                    <span className="px-3 py-1 glass-chip rounded-full text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Trophy className="w-8 h-8 text-coin" />
                                    <div>
                                        <div className="font-bold">Ranked Match</div>
                                        <div className="text-xs text-muted-strong">Compete on leaderboards</div>
                                    </div>
                                </div>
                            </div>

                            {/* Shop */}
                            <div className="p-4 rounded-xl glass-surface-1 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-background/45 backdrop-blur-[2px] flex items-center justify-center z-10">
                                    <span className="px-3 py-1 glass-chip rounded-full text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <ShoppingBag className="w-8 h-8 text-accent" />
                                    <div>
                                        <div className="font-bold">Board Shop</div>
                                        <div className="text-xs text-muted-strong">Customize your tokens & board</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={handleStartGame}
                        className="w-full py-4 text-lg font-bold rounded-xl gradient-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                        Start Game ({playerCount} Players)
                    </button>

                </div>
            </div>
        </div>
    );
}
