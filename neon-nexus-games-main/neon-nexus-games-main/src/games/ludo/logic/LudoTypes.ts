export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type TokenState = 'base' | 'board' | 'home_path' | 'finished';

export interface Token {
    id: number; // 0-3 for each player
    color: PlayerColor;
    state: TokenState;
    position: number; // 0-51 for board, 0-5 for home_path
    safe: boolean; // true if on a safe square
}

export interface Player {
    id: string; // User ID or 'bot-x'
    color: PlayerColor;
    name: string;
    isBot: boolean;
    tokens: Token[];
    finishedRank?: number; // 1st, 2nd, 3rd, 4th (undefined if playing)
    hasLeft: boolean;
}

export interface DiceState {
    value: number;
    rolled: boolean;
    consecutiveSixes: number;
    used: boolean; // If true, player has moved and turn is advancing (or waiting for extra roll)
}

export type GamePhase = 'waiting' | 'playing' | 'completed';

export interface LudoGameState {
    phase: GamePhase;
    players: Player[];
    activePlayerIndex: number; // Index in players array
    dice: DiceState;
    pot: number; // Total coins in the pot
    winnerId?: string;
    turnLog: string[];
}

export interface Move {
    playerId: string;
    tokenIndex: number;
    fromState: TokenState;
    fromPosition: number;
    destState: TokenState;
    destPosition: number;
    isCapture: boolean;
    capturedTokenId?: number;
    capturedPlayerId?: string;
}
