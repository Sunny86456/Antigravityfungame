import React from 'react';
import { Token, PlayerColor } from '../logic/LudoTypes';
import { cn } from '@/lib/utils';
import { LudoToken } from './LudoToken';
import { getBoardGridPos, getHomePathGridPos, BASE_POSITIONS, CENTER_POS } from './LudoBoardLayout';

// Star safe square positions (8 total - authentic Ludo)
const STAR_POSITIONS = [
    { r: 6, c: 1 },   // Red start
    { r: 1, c: 8 },   // Blue start
    { r: 8, c: 13 },  // Yellow start
    { r: 13, c: 6 },  // Green start
    { r: 2, c: 6 },   // Safe houses
    { r: 6, c: 12 },
    { r: 12, c: 8 },
    { r: 8, c: 2 },
];

interface LudoBoardProps {
    tokens: Token[];
    onTokenClick: (tokenIndex: number) => void;
    validTokenIndices: number[];
    activePlayerColor: PlayerColor;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
    tokens,
    onTokenClick,
    validTokenIndices,
    activePlayerColor
}) => {

    const getTokenGridPos = (token: Token) => {
        if (token.state === 'base') {
            return BASE_POSITIONS[token.color][token.id % 4];
        } else if (token.state === 'board') {
            return getBoardGridPos(token.position);
        } else if (token.state === 'home_path') {
            return getHomePathGridPos(token.color, token.position);
        } else if (token.state === 'finished') {
            return CENTER_POS;
        }
        return { r: 0, c: 0 };
    };

    const hasStar = (r: number, c: number) =>
        STAR_POSITIONS.some(p => p.r === r && p.c === c);

    // =========================================
    // 3D Base Panel with glossy effect
    // =========================================
    const BasePanel = ({
        color,
        gridArea
    }: {
        color: 'red' | 'green' | 'yellow' | 'blue';
        gridArea: string;
    }) => {
        const colorStyles = {
            red: {
                outer: 'linear-gradient(145deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                inner: '#dc2626',
                slot: 'linear-gradient(145deg, #ef4444, #b91c1c)'
            },
            blue: {
                outer: 'linear-gradient(145deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                inner: '#2563eb',
                slot: 'linear-gradient(145deg, #3b82f6, #1d4ed8)'
            },
            green: {
                outer: 'linear-gradient(145deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                inner: '#16a34a',
                slot: 'linear-gradient(145deg, #22c55e, #15803d)'
            },
            yellow: {
                outer: 'linear-gradient(145deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
                inner: '#eab308',
                slot: 'linear-gradient(145deg, #facc15, #ca8a04)'
            },
        };
        const styles = colorStyles[color];

        // Get tokens for this base
        const baseTokens = tokens.filter(t => t.color === color && t.state === 'base');

        return (
            <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                    gridArea,
                    background: styles.outer,
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2)'
                }}
            >
                {/* Inner white area with 3D inset effect */}
                <div
                    className="absolute rounded-xl"
                    style={{
                        top: '12%',
                        left: '12%',
                        right: '12%',
                        bottom: '12%',
                        background: 'linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%)',
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15)'
                    }}
                >
                    {/* 2x2 token slots */}
                    <div className="absolute inset-[10%] grid grid-cols-2 grid-rows-2 gap-[8%]">
                        {[0, 1, 2, 3].map(i => {
                            const token = baseTokens.find(t => t.id === i);
                            const isValid = token && token.color === activePlayerColor && validTokenIndices.includes(token.id);

                            return (
                                <div
                                    key={i}
                                    className="relative rounded-full flex items-center justify-center"
                                    style={{
                                        background: styles.slot,
                                        boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(255,255,255,0.1)'
                                    }}
                                >
                                    {token && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <LudoToken
                                                color={color}
                                                isClickable={isValid || false}
                                                isHighlighted={isValid || false}
                                                onClick={() => token && isValid && onTokenClick(token.id)}
                                                size="sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // =========================================
    // Track Tile with 3D inset effect
    // =========================================
    const Tile = ({
        row,
        col,
        color,
    }: {
        row: number;
        col: number;
        color?: 'red' | 'green' | 'yellow' | 'blue';
    }) => {
        const bgColors = {
            red: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
            blue: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
            green: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
            yellow: 'linear-gradient(180deg, #facc15 0%, #eab308 100%)',
        };

        const showStar = hasStar(row, col);

        return (
            <div
                className="flex items-center justify-center"
                style={{
                    gridRowStart: row + 1,
                    gridColumnStart: col + 1,
                    background: color ? bgColors[color] : 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
                    border: '0.5px solid #d0d0d0',
                    boxShadow: color
                        ? 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.1)'
                        : 'inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.05)'
                }}
            >
                {showStar && (
                    <div className="text-gray-400 text-[0.5rem]">★</div>
                )}
            </div>
        );
    };

    // Generate track tiles
    const renderTrackTiles = () => {
        const tiles: JSX.Element[] = [];

        // Horizontal arm
        for (let row = 6; row <= 8; row++) {
            for (let col = 0; col <= 14; col++) {
                if (col >= 6 && col <= 8) continue;

                let color: 'red' | 'green' | 'yellow' | 'blue' | undefined;
                if (row === 7 && col >= 1 && col <= 5) color = 'red';
                if (row === 7 && col >= 9 && col <= 13) color = 'yellow';

                tiles.push(<Tile key={`h-${row}-${col}`} row={row} col={col} color={color} />);
            }
        }

        // Vertical arm
        for (let col = 6; col <= 8; col++) {
            for (let row = 0; row <= 14; row++) {
                if (row >= 6 && row <= 8) continue;

                let color: 'red' | 'green' | 'yellow' | 'blue' | undefined;
                if (col === 7 && row >= 1 && row <= 5) color = 'blue';
                if (col === 7 && row >= 9 && row <= 13) color = 'green';

                tiles.push(<Tile key={`v-${row}-${col}`} row={row} col={col} color={color} />);
            }
        }

        return tiles;
    };

    // =========================================
    // 3D Center HOME with diamond rotation
    // =========================================
    const CenterHome = () => (
        <div
            className="flex items-center justify-center"
            style={{
                gridArea: '7 / 7 / 10 / 10',
            }}
        >
            {/* Diamond container rotated 45deg */}
            <div
                className="relative w-[85%] h-[85%] rounded-xl overflow-hidden"
                style={{
                    transform: 'rotate(45deg)',
                    background: '#fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 0 0 4px white'
                }}
            >
                {/* 4 color quadrants */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    <div style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }} />
                    <div style={{ background: 'linear-gradient(135deg, #facc15, #eab308)' }} />
                    <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} />
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }} />
                </div>

                {/* White center circle */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full flex items-center justify-center"
                    style={{
                        width: '40%',
                        height: '40%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                >
                    <span className="text-[0.45rem] sm:text-[0.55rem] font-bold text-gray-700 tracking-tight">
                        HOME
                    </span>
                </div>
            </div>
        </div>
    );

    // Render tokens on board (not in base)
    const renderBoardTokens = () => {
        return tokens
            .filter(t => t.state !== 'base')
            .map(token => {
                const pos = getTokenGridPos(token);
                const isValid = token.color === activePlayerColor && validTokenIndices.includes(token.id);

                return (
                    <div
                        key={`${token.color}-${token.id}`}
                        className="z-20 flex items-center justify-center"
                        style={{
                            gridRowStart: pos.r + 1,
                            gridColumnStart: pos.c + 1,
                        }}
                    >
                        <LudoToken
                            color={token.color as 'red' | 'green' | 'yellow' | 'blue'}
                            isClickable={isValid}
                            isHighlighted={isValid}
                            onClick={() => isValid && onTokenClick(token.id)}
                            size="sm"
                        />
                    </div>
                );
            });
    };

    // =========================================
    // MAIN RENDER - 3D Board
    // =========================================
    return (
        <div
            className="w-full h-full rounded-3xl overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)'
            }}
        >
            <div
                className="w-full h-full p-1"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(15, 1fr)',
                    gridTemplateRows: 'repeat(15, 1fr)',
                }}
            >
                {/* Base Panels with embedded tokens */}
                <BasePanel color="red" gridArea="1 / 1 / 7 / 7" />
                <BasePanel color="blue" gridArea="1 / 10 / 7 / 16" />
                <BasePanel color="green" gridArea="10 / 1 / 16 / 7" />
                <BasePanel color="yellow" gridArea="10 / 10 / 16 / 16" />

                {/* Track Tiles */}
                {renderTrackTiles()}

                {/* Center HOME */}
                <CenterHome />

                {/* Tokens on board (not in base) */}
                {renderBoardTokens()}
            </div>
        </div>
    );
};
