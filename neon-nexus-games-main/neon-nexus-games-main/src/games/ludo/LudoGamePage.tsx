import React, { useState, useMemo } from 'react';
import { LudoEngine } from './logic/LudoEngine';
import { Player, PlayerColor } from './logic/LudoTypes';
import { createPlayersForMatch, getOppositeColor } from './logic/LudoMatchSetup';
import { useLudoGame } from './ui/useLudoGame';
import { LudoBoard } from './components/LudoBoard';
import { LudoDice } from './components/LudoDice';
import { ArrowLeft, Volume2, Pause, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// =============================================
// Player Selection Screen Component
// =============================================
interface PlayerSelectProps {
    onSelect: (count: number) => void;
}

const PlayerSelectScreen: React.FC<PlayerSelectProps> = ({ onSelect }) => {
    const options = [
        { count: 2, label: '2 Players', desc: '1 Human vs 1 Bot' },
        { count: 3, label: '3 Players', desc: '1 Human vs 2 Bots' },
        { count: 4, label: '4 Players', desc: '1 Human vs 3 Bots' },
    ];

    return (
        <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#e8eef4] to-[#d0dae4] flex flex-col items-center justify-center p-6">
            {/* Back button */}
            <Link
                to="/games/ludo"
                className={cn(
                    "absolute top-6 left-6 w-12 h-10 rounded-xl",
                    "bg-gradient-to-b from-white to-gray-50 border-2 border-gray-100",
                    "shadow-[0_4px_0_#e5e7eb,0_6px_12px_rgba(0,0,0,0.1)]",
                    "hover:-translate-y-0.5 active:translate-y-1",
                    "transition-all duration-150",
                    "flex items-center justify-center"
                )}
            >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>

            {/* Title */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 mb-4 shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    Choose Players
                </h1>
                <p className="text-gray-500 text-sm">
                    Select number of players for AI match
                </p>
            </div>

            {/* Selection buttons */}
            <div className="flex flex-col gap-4 w-full max-w-xs">
                {options.map(({ count, label, desc }) => (
                    <button
                        key={count}
                        onClick={() => onSelect(count)}
                        className={cn(
                            "relative p-1 rounded-2xl bg-gradient-to-b from-white to-gray-50",
                            "shadow-[0_4px_0_#e5e7eb,0_6px_12px_rgba(0,0,0,0.1)]",
                            "hover:-translate-y-1 hover:shadow-[0_6px_0_#e5e7eb,0_10px_20px_rgba(0,0,0,0.15)]",
                            "active:translate-y-1 active:shadow-[0_1px_0_#e5e7eb,0_2px_4px_rgba(0,0,0,0.08)]",
                            "transition-all duration-150",
                            "group"
                        )}
                    >
                        <div className="flex items-center justify-between px-6 py-4 rounded-xl border-2 border-gray-100 group-hover:border-green-200">
                            {/* Player count indicator */}
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {Array.from({ length: count }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold",
                                                i === 0 && "bg-gradient-to-br from-red-400 to-red-600",
                                                i === 1 && "bg-gradient-to-br from-blue-400 to-blue-600",
                                                i === 2 && "bg-gradient-to-br from-green-400 to-green-600",
                                                i === 3 && "bg-gradient-to-br from-yellow-400 to-yellow-600",
                                            )}
                                        >
                                            {i === 0 ? '👤' : '🤖'}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold text-gray-800">{label}</div>
                                    <div className="text-xs text-gray-400">{desc}</div>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="text-gray-300 group-hover:text-green-500 transition-colors">
                                →
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// =============================================
// Main Game Screen Component
// =============================================
interface GameScreenProps {
    players: Player[];
    onBack: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ players, onBack }) => {
    const [engine] = useState(() => new LudoEngine(players, 200));
    const { gameState, validMoves, handleRollDice, handleMoveToken } = useLudoGame(engine);

    if (!gameState) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#e8eef4] to-[#dce4ec] flex items-center justify-center">
                <span className="text-gray-500 text-lg">Loading...</span>
            </div>
        );
    }

    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const isMyTurn = !activePlayer.isBot;
    const validTokenIds = validMoves.map(m => m.tokenIndex);
    const allTokens = gameState.players.flatMap(p => p.tokens);

    return (
        <div className="min-h-[100dvh] w-full bg-gradient-to-b from-[#e8eef4] to-[#d0dae4] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">

            {/* 1. LUDO BOARD (Center Hero) */}
            <div className="relative z-10 w-full max-w-[420px] sm:max-w-[480px] aspect-square mb-6">
                {/* Board outer shell with soft shadow */}
                <div className="w-full h-full bg-white rounded-[32px] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.2),0_8px_24px_-8px_rgba(0,0,0,0.1)] p-2 sm:p-3 border border-gray-100">
                    <LudoBoard
                        tokens={allTokens}
                        validTokenIndices={isMyTurn ? validTokenIds : []}
                        onTokenClick={handleMoveToken}
                        activePlayerColor={activePlayer.color}
                    />
                </div>
            </div>

            {/* 2. DICE (Centered Below Board) */}
            <div className="relative z-20 mb-8">
                <LudoDice
                    value={gameState.dice.value}
                    rolling={false}
                    canRoll={isMyTurn && !gameState.dice.rolled}
                    onRoll={handleRollDice}
                    color={activePlayer.color}
                />

                {/* Turn indicator text */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap">
                    <span className={cn(
                        "text-sm font-semibold tracking-wide",
                        isMyTurn ? "text-gray-700" : "text-gray-400"
                    )}>
                        {activePlayer.isBot ? `${activePlayer.name}...` : (isMyTurn ? "Your Turn" : "")}
                    </span>
                </div>
            </div>

            {/* 3. CONTROL BUTTONS (Bottom) */}
            <div className="flex items-center gap-5 mt-4">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className={cn(
                        "w-14 h-11 rounded-xl",
                        "bg-gradient-to-b from-white to-gray-50 border-2 border-gray-100",
                        "shadow-[0_4px_0_#e5e7eb,0_6px_12px_rgba(0,0,0,0.1)]",
                        "hover:-translate-y-0.5 hover:shadow-[0_6px_0_#e5e7eb,0_8px_16px_rgba(0,0,0,0.15)]",
                        "active:translate-y-1 active:shadow-[0_1px_0_#e5e7eb,0_2px_4px_rgba(0,0,0,0.08)]",
                        "transition-all duration-150",
                        "flex items-center justify-center"
                    )}
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>

                {/* Sound Button */}
                <button
                    className={cn(
                        "w-14 h-11 rounded-xl",
                        "bg-gradient-to-b from-white to-gray-50 border-2 border-gray-100",
                        "shadow-[0_4px_0_#e5e7eb,0_6px_12px_rgba(0,0,0,0.1)]",
                        "hover:-translate-y-0.5 hover:shadow-[0_6px_0_#e5e7eb,0_8px_16px_rgba(0,0,0,0.15)]",
                        "active:translate-y-1 active:shadow-[0_1px_0_#e5e7eb,0_2px_4px_rgba(0,0,0,0.08)]",
                        "transition-all duration-150",
                        "flex items-center justify-center"
                    )}
                >
                    <Volume2 className="w-5 h-5 text-gray-500" />
                </button>

                {/* Pause Button */}
                <button
                    className={cn(
                        "w-14 h-11 rounded-xl",
                        "bg-gradient-to-b from-white to-gray-50 border-2 border-gray-100",
                        "shadow-[0_4px_0_#e5e7eb,0_6px_12px_rgba(0,0,0,0.1)]",
                        "hover:-translate-y-0.5 hover:shadow-[0_6px_0_#e5e7eb,0_8px_16px_rgba(0,0,0,0.15)]",
                        "active:translate-y-1 active:shadow-[0_1px_0_#e5e7eb,0_2px_4px_rgba(0,0,0,0.08)]",
                        "transition-all duration-150",
                        "flex items-center justify-center"
                    )}
                >
                    <Pause className="w-5 h-5 text-gray-500" />
                </button>
            </div>
        </div>
    );
};

// =============================================
// Main Page Component with Flow Control
// =============================================
export default function LudoGamePage() {
    const [playerCount, setPlayerCount] = useState<number | null>(null);

    // Generate players when count is selected
    const players = useMemo(() => {
        if (playerCount === null) return null;
        return createPlayersForMatch(playerCount);
    }, [playerCount]);

    // If no player count selected, show selection screen
    if (playerCount === null) {
        return <PlayerSelectScreen onSelect={setPlayerCount} />;
    }

    // If players are ready, show game screen
    if (players) {
        return <GameScreen players={players} onBack={() => setPlayerCount(null)} />;
    }

    // Loading fallback
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#e8eef4] to-[#dce4ec] flex items-center justify-center">
            <span className="text-gray-500 text-lg">Loading...</span>
        </div>
    );
}
