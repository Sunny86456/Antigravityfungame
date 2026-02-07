import {
    LudoGameState, Player, Token, DiceState, Move, PlayerColor, TokenState
} from './LudoTypes';
import {
    BOARD_SIZE, START_POSITIONS, HOME_ENTRANCE, SAFE_SQUARES,
    COLORS, HOME_PATH_LENGTH
} from './LudoConstants';

export class LudoEngine {
    private state: LudoGameState;
    private matchId: string;
    private turnNumber: number = 0;

    constructor(players: Player[], pot: number, matchId?: string) {
        this.matchId = matchId || crypto.randomUUID();
        this.state = {
            phase: 'playing',
            players,
            activePlayerIndex: 0,
            dice: { value: 0, rolled: false, consecutiveSixes: 0, used: false },
            pot,
            turnLog: []
        };
    }

    public getMatchId(): string {
        return this.matchId;
    }

    public getTurnNumber(): number {
        return this.turnNumber;
    }

    public getState(): LudoGameState {
        return JSON.parse(JSON.stringify(this.state)); // Deep copy for safety
    }

    // --- Core Actions ---

    /**
     * Apply a server-generated dice roll value
     * SECURITY: Dice values MUST come from server-side cryptographic RNG
     * Client cannot influence or submit dice values
     * 
     * @param value - Dice value (1-6) from server
     * @param rollId - Unique roll ID for replay prevention (optional for AI)
     */
    public applyServerRoll(value: number, rollId?: string): void {
        // Validate dice value range (server-enforced, but double-check)
        if (value < 1 || value > 6) {
            throw new Error("Invalid dice value");
        }

        if (this.state.dice.rolled && !this.state.dice.used) {
            throw new Error("Dice already rolled, must move first.");
        }

        // Increment turn number for tracking
        this.turnNumber++;

        // Consecutive 6 logic
        let consecutive = this.state.dice.consecutiveSixes;
        if (value === 6) {
            consecutive++;
        } else {
            consecutive = 0;
        }

        this.state.dice = {
            value,
            rolled: true,
            consecutiveSixes: consecutive,
            used: false
        };

        // Creating a log entry
        this.log(`Player ${this.state.players[this.state.activePlayerIndex].color} rolled a ${value}`);

        // If 3 consecutive sixes, turn ends immediately
        if (consecutive === 3) {
            this.log("Three consecutive sixes! Turn skipped.");
            this.nextTurn();
        } else {
            // Check if any moves are possible
            const moves = this.getValidMoves();
            if (moves.length === 0) {
                this.log("No valid moves possible.");
                this.nextTurn(); // Auto-skip if no moves
            }
        }
    }

    /**
     * Generate a local dice roll for AI players only
     * SECURITY: This is only used for offline AI matches
     * For multiplayer/ranked games, use applyServerRoll()
     */
    public rollDiceForAI(): number {
        // For AI, we can still use local random as it's not cheat-sensitive
        const value = Math.floor(Math.random() * 6) + 1;
        this.applyServerRoll(value);
        return value;
    }

    public getValidMoves(): Move[] {
        const player = this.state.players[this.state.activePlayerIndex];
        const roll = this.state.dice.value;
        const moves: Move[] = [];

        if (!this.state.dice.rolled || this.state.dice.used) return [];
        if (this.state.dice.consecutiveSixes >= 3) return []; // Should be handled by rollDice, but safety check

        player.tokens.forEach((token, index) => {
            // Rule: Must roll 6 to leave base
            if (token.state === 'base') {
                if (roll === 6) {
                    moves.push({
                        playerId: player.id,
                        tokenIndex: index,
                        fromState: 'base',
                        fromPosition: -1,
                        destState: 'board',
                        destPosition: START_POSITIONS[player.color],
                        isCapture: this.checkCapture(START_POSITIONS[player.color], player.color) !== null
                    });
                }
                return;
            }

            // Rule: Moving on board
            if (token.state === 'board') {
                const currentPos = token.position;
                const entrance = HOME_ENTRANCE[player.color];

                // logic to calculate next position handling wrapping
                // Distance check: How far from home entrance?
                // We need to handle wrapping manually

                let distanceToEntrance = -1;
                if (currentPos <= entrance && entrance < currentPos + BOARD_SIZE) {
                    // Logic is tricky because circular buffer. 
                    // Simpler approach: Simulate step by step or use modular arithmetic distance
                    distanceToEntrance = (entrance - currentPos + BOARD_SIZE) % BOARD_SIZE;
                }

                // Better Logic:
                // Calculate raw destination index (0-51)
                const rawDest = (currentPos + roll) % BOARD_SIZE;

                // Check if we passed the Home Entrance
                // To do this simply, we can track "steps taken" or just check ranges based on color

                // Let's use specific range checks for each color to allow Home Entry
                /*
                  Red: Ent 50. If pos 48 + 4 -> 52 (Over 50) -> Enter Home
                  Green: Ent 11. If pos 10 + 4 -> 14 (Over 11) -> Enter Home
                */

                const willEnterHome = this.doesMoveEnterHome(token.position, roll, player.color);

                if (willEnterHome) {
                    const homePathIndex = this.calculateHomePathIndex(token.position, roll, player.color);
                    if (homePathIndex <= 5) { // 5 is 'Home' center
                        // Valid Home Move
                        moves.push({
                            playerId: player.id,
                            tokenIndex: index,
                            fromState: 'board',
                            fromPosition: currentPos,
                            destState: homePathIndex === 5 ? 'finished' : 'home_path',
                            destPosition: homePathIndex === 5 ? 0 : homePathIndex, // If finished, pos doesn't matter much
                            isCapture: false
                        });
                    }
                } else {
                    // Normal board move
                    moves.push({
                        playerId: player.id,
                        tokenIndex: index,
                        fromState: 'board',
                        fromPosition: currentPos,
                        destState: 'board',
                        destPosition: rawDest,
                        isCapture: this.checkCapture(rawDest, player.color) !== null
                    });
                }
            }

            // Rule: Moving inside Home Path
            if (token.state === 'home_path') {
                const nextPos = token.position + roll;
                if (nextPos <= 5) {
                    moves.push({
                        playerId: player.id,
                        tokenIndex: index,
                        fromState: 'home_path',
                        fromPosition: token.position,
                        destState: nextPos === 5 ? 'finished' : 'home_path',
                        destPosition: nextPos === 5 ? 0 : nextPos,
                        isCapture: false
                    });
                }
            }
        });

        return moves;
    }

    public executeMove(tokenIndex: number): void {
        const validMoves = this.getValidMoves();
        const move = validMoves.find(m => m.tokenIndex === tokenIndex);

        if (!move) {
            throw new Error("Invalid move attempted");
        }

        const player = this.state.players[this.state.activePlayerIndex];
        const token = player.tokens[tokenIndex];

        // 1. Update Token State
        token.state = move.destState;
        token.position = move.destPosition;
        token.safe = this.isSafeSquare(move.destState, move.destPosition);

        // 2. Handle Capture
        if (move.isCapture) { // Engine recalculates actual capture to be safe
            const captured = this.checkCapture(move.destPosition, player.color);
            if (captured) {
                this.captureToken(captured.playerId, captured.tokenIndex);
                move.capturedPlayerId = captured.playerId;
                move.capturedTokenId = captured.tokenIndex;
                this.log(`Captured ${captured.playerId}'s token!`);
            }
        }

        // 3. Mark Dice Used
        this.state.dice.used = true;

        // 4. Determine Next Turn
        // Rules: 
        // - Rolled 6 -> Roll again
        // - Capture -> Roll again (Some rules say yes, some no. Let's say YES for excitement)
        // - Reached Home -> Roll again? (Usually yes)

        // Simplify: Extra turn if (Six OR Capture OR Finished)
        // But max 3 sixes rule already handled in roll

        const earnedExtraTurn = (this.state.dice.value === 6) || (!!move.capturedPlayerId) || (move.destState === 'finished');

        this.checkWinCondition();

        if (earnedExtraTurn && this.state.phase === 'playing' && this.state.dice.consecutiveSixes < 3) {
            this.log("Extra turn awarded!");
            this.state.dice.used = false; // Reset used flag, keep consecutive count for 6s
            this.state.dice.rolled = false; // Allow re-roll
            // Do NOT advance player index
        } else {
            this.nextTurn();
        }
    }

    // --- Helpers ---

    private nextTurn(): void {
        // Reset Dice
        this.state.dice = {
            value: 0,
            rolled: false,
            consecutiveSixes: 0,
            used: false
        };

        // Find next active player
        let loops = 0;
        do {
            this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;
            loops++;
        } while (this.state.players[this.state.activePlayerIndex].finishedRank !== undefined && loops < 5);

        // If everyone finished but one, game over
        const activePlayers = this.state.players.filter(p => p.finishedRank === undefined);
        if (activePlayers.length <= 1 && this.state.players.length > 1) { // >1 ensures solo testing works
            this.state.phase = 'completed';
            this.log("Game Completed");
        }
    }

    private checkCapture(pos: number, myColor: PlayerColor): { playerId: string, tokenIndex: number } | null {
        // Safe squares cannot capture
        if (SAFE_SQUARES.includes(pos)) return null;

        // Check all opponents
        for (const p of this.state.players) {
            if (p.color === myColor) continue;
            // Check if any of their tokens are at 'pos' and on 'board'
            for (let i = 0; i < p.tokens.length; i++) {
                const t = p.tokens[i];
                if (t.state === 'board' && t.position === pos) {
                    return { playerId: p.id, tokenIndex: i };
                }
            }
        }
        return null;
    }

    private captureToken(pId: string, tIndex: number) {
        const p = this.state.players.find(pl => pl.id === pId);
        if (p) {
            const t = p.tokens[tIndex];
            t.state = 'base';
            t.position = -1;
            t.safe = true;
        }
    }

    private isSafeSquare(state: TokenState, pos: number): boolean {
        if (state === 'base' || state === 'home_path' || state === 'finished') return true;
        return SAFE_SQUARES.includes(pos);
    }

    private doesMoveEnterHome(currentPos: number, roll: number, color: PlayerColor): boolean {
        const entrance = HOME_ENTRANCE[color];
        // Logic: If currentPos <= entrance AND (currentPos + roll) > entrance
        // Need to handle wrap around for Green/Yellow/Blue

        // Relative Logic
        const start = START_POSITIONS[color];
        const relPos = (currentPos - start + BOARD_SIZE) % BOARD_SIZE;
        const relDest = relPos + roll;

        // Board path length is 51 squares from start relative (0 to 50 is 51 steps)
        // Entrance is at relative index 50.
        // So if relPos <= 50 AND relDest > 50, we enter home.

        // Wait, BOARD_SIZE = 52.
        // 0..50 are board squares (51 squares). 
        // 51st square is the last one before home?

        // Let's standardise: 
        // Path is 52 squares.
        // Start is 0 (Red). 
        // It moves 0 -> 1 -> ... -> 50.
        // 50 is entrance. Next is Home[0].
        // 51 is NOT visited by Red. 51 is reachable by other colors.
        // So Red's track is 0..50 (which is 51 squares).

        return relPos <= 50 && relDest > 50;
    }

    private calculateHomePathIndex(currentPos: number, roll: number, color: PlayerColor): number {
        const start = START_POSITIONS[color];
        const relPos = (currentPos - start + BOARD_SIZE) % BOARD_SIZE;
        const relDest = relPos + roll; // e.g. 50 + 1 = 51 (Home[0])

        // Entrance is 50.
        // 51 -> Home 0
        // 52 -> Home 1
        // ...
        // 56 -> Home 5 (Finish)

        const excess = relDest - 50;
        // excess 1 = index 0
        return excess - 1;
    }

    private checkWinCondition() {
        const player = this.state.players[this.state.activePlayerIndex];
        const allFinished = player.tokens.every(t => t.state === 'finished');

        if (allFinished && player.finishedRank === undefined) {
            // Assign rank
            const finishedCount = this.state.players.filter(p => p.finishedRank !== undefined).length;
            player.finishedRank = finishedCount + 1;
            this.log(`Player ${player.color} Finished Rank ${player.finishedRank}!`);
        }
    }

    private log(msg: string) {
        this.state.turnLog.push(msg);
        if (this.state.turnLog.length > 50) this.state.turnLog.shift();
    }
}
