import React from 'react';
import { cn } from '@/lib/utils';

interface LudoDiceProps {
    value: number;
    rolling: boolean;
    canRoll: boolean;
    onRoll: () => void;
    color: string;
}

// Pip positions for each dice value (1-6) in 3x3 grid
const PIP_PATTERNS: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 2], [2, 0]],
    3: [[0, 2], [1, 1], [2, 0]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

export const LudoDice: React.FC<LudoDiceProps> = ({ value, rolling, canRoll, onRoll }) => {
    const pips = PIP_PATTERNS[value] || PIP_PATTERNS[1];

    return (
        <button
            onClick={onRoll}
            disabled={!canRoll || rolling}
            className={cn(
                "relative transition-all duration-150",
                canRoll && !rolling && "cursor-pointer hover:scale-105 active:scale-95",
                !canRoll && !rolling && "opacity-60 cursor-not-allowed",
                rolling && "animate-bounce"
            )}
            style={{
                width: 72,
                height: 72,
            }}
        >
            {/* 3D Dice cube using layered elements */}
            <div
                className="relative w-full h-full rounded-2xl"
                style={{
                    // Main face with 3D gradient
                    background: 'linear-gradient(145deg, #ffffff 0%, #f0f0f0 50%, #e8e8e8 100%)',
                    // Multiple shadows for 3D depth
                    boxShadow: `
                        0 6px 0 #d0d0d0,
                        0 8px 0 #c0c0c0,
                        0 10px 20px rgba(0,0,0,0.15),
                        inset 0 2px 4px rgba(255,255,255,0.9),
                        inset 0 -2px 4px rgba(0,0,0,0.05)
                    `,
                    border: '1px solid #e0e0e0',
                }}
            >
                {/* Dice face - 3x3 pip grid */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div
                        className="w-full h-full"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, 1fr)',
                            gap: 4,
                        }}
                    >
                        {[0, 1, 2].map(row =>
                            [0, 1, 2].map(col => {
                                const hasPip = pips.some(([r, c]) => r === row && c === col);
                                return (
                                    <div
                                        key={`${row}-${col}`}
                                        className="flex items-center justify-center"
                                    >
                                        {hasPip && (
                                            <div
                                                className="rounded-full"
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    background: 'linear-gradient(145deg, #404040 0%, #1a1a1a 100%)',
                                                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.3)'
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
};
