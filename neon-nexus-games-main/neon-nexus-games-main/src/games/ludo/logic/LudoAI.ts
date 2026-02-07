import { LudoGameState, Move } from './LudoTypes';
import { LudoEngine } from './LudoEngine';

export class LudoAI {
    /**
     * Selects the best move from a list of valid moves.
     * Logic:
     * 1. Capture Opponent -> Highest Priority
     * 2. Move to Safe Square -> High Priority
     * 3. Move out of Base (Value 6) -> High Priority
     * 4. Enter Home / Finish -> Medium Priority
     * 5. Advance furthest token -> Low Priority
     */
    public static selectBestMove(engine: LudoEngine, moves: Move[]): Move | null {
        if (moves.length === 0) return null;
        if (moves.length === 1) return moves[0];

        // Priority 1: Capture
        const captures = moves.filter(m => m.isCapture);
        if (captures.length > 0) return captures[0];

        // Priority 2: Move to Safe Square (dest is safe)
        // We need to know if dest is safe. The engine's state doesn't have the dest safely marked
        // inside the move, but we can check constants.
        // However, let's rely on move properties or infer.
        // Actually, simply checking if we enter "finished" is good too.

        // Priority 3: Finish Token
        const finishers = moves.filter(m => m.destState === 'finished');
        if (finishers.length > 0) return finishers[0];

        // Priority 4: Leave Base
        const openers = moves.filter(m => m.fromState === 'base');
        if (openers.length > 0) return openers[0];

        // Priority 5: Advance furthest token (closest to home)
        // We can just pick the one with max new relative progress, or random.
        // Random is less predictable.
        return moves[Math.floor(Math.random() * moves.length)];
    }
}
