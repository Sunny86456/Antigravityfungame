import { useRef, useEffect, useState, useCallback } from 'react';
import { LudoEngine } from '../logic/LudoEngine';
import { LudoGameState, Move, Token } from '../logic/LudoTypes';
import { LudoAI } from '../logic/LudoAI';
import { AI_DELAY_MS } from '../logic/LudoConstants';
import { requestDiceRoll, consumeRoll } from '../logic/ludoService';

export function useLudoGame(engine: LudoEngine | null) {
    const [gameState, setGameState] = useState<LudoGameState | null>(null);
    const [validMoves, setValidMoves] = useState<Move[]>([]);
    const [lastMove, setLastMove] = useState<Move | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [lastRollId, setLastRollId] = useState<string | null>(null);

    // Sync state initially
    useEffect(() => {
        if (engine) {
            setGameState(engine.getState());
            setValidMoves(engine.getValidMoves());
        }
    }, [engine]);

    // AI Loop
    useEffect(() => {
        if (!engine || !gameState) return;

        const currentPlayer = gameState.players[gameState.activePlayerIndex];
        if (gameState.phase === 'playing' && currentPlayer.isBot && !gameState.dice.rolled) {
            // AI Turn: Roll (local random for AI)
            const timer = setTimeout(() => {
                try {
                    handleAIRoll();
                } catch (e) {
                    console.error("AI Auto-Roll Failed", e);
                }
            }, AI_DELAY_MS);
            return () => clearTimeout(timer);
        }

        if (gameState.phase === 'playing' && currentPlayer.isBot && gameState.dice.rolled && !gameState.dice.used) {
            // AI Turn: Move
            const timer = setTimeout(() => {
                const moves = engine.getValidMoves();
                if (moves.length > 0) {
                    const bestMove = LudoAI.selectBestMove(engine, moves);
                    if (bestMove) {
                        handleMoveToken(bestMove.tokenIndex);
                    } else {
                        // Should not happen if moves > 0
                        handleMoveToken(moves[0].tokenIndex);
                    }
                } else {
                    // No moves, engine auto-skips in rollDice() usually, but if manual nextTurn needed:
                    // Actually rollDice() handles nextTurn if no moves.
                    // But wait, getValidMoves is called AFTER roll. 
                    // If getValidMoves returns empty, engine should have advanced turn?
                    // Let's check engine logic. Engine advances turn inside rollDice if no moves.
                    // So we wouldn't be here in that case.
                }
            }, AI_DELAY_MS);
            return () => clearTimeout(timer);
        }
    }, [gameState, engine]);

    const updateState = useCallback(() => {
        if (engine) {
            setGameState(engine.getState());
            setValidMoves(engine.getValidMoves());
        }
    }, [engine]);

    /**
     * Handle dice roll for AI players (local random)
     * AI matches don't need server-side RNG for security
     */
    const handleAIRoll = useCallback(() => {
        if (!engine) return;
        try {
            engine.rollDiceForAI();
            updateState();
        } catch (e) {
            console.error(e);
        }
    }, [engine, updateState]);

    /**
     * Handle dice roll for human players
     * SECURITY: Uses server-side cryptographic RNG
     */
    const handleRollDice = useCallback(async () => {
        if (!engine || isRolling) return;

        const currentPlayer = gameState?.players[gameState.activePlayerIndex];

        // For AI players, use local random
        if (currentPlayer?.isBot) {
            handleAIRoll();
            return;
        }

        // For human players, request from server
        setIsRolling(true);
        try {
            const matchId = engine.getMatchId();
            const turnNumber = engine.getTurnNumber() + 1;

            const response = await requestDiceRoll(matchId, turnNumber);

            if (response.success && response.value && response.rollId) {
                engine.applyServerRoll(response.value, response.rollId);
                setLastRollId(response.rollId);
                updateState();
            } else {
                console.error('[useLudoGame] Server roll failed:', response.error);
                // Fallback for offline/unauthenticated play (e.g., guest mode)
                engine.rollDiceForAI();
                updateState();
            }
        } catch (e) {
            console.error('[useLudoGame] Roll request error:', e);
            // Fallback for network errors
            engine.rollDiceForAI();
            updateState();
        } finally {
            setIsRolling(false);
        }
    }, [engine, gameState, isRolling, handleAIRoll, updateState]);

    const handleMoveToken = useCallback(async (tokenIndex: number) => {
        if (!engine) return;
        try {
            engine.executeMove(tokenIndex);
            setLastMove(engine.getState().turnLog.slice(-1) as any);

            // Mark the roll as consumed (replay prevention)
            if (lastRollId) {
                await consumeRoll(lastRollId);
                setLastRollId(null);
            }

            updateState();
        } catch (e) {
            console.error(e);
        }
    }, [engine, lastRollId, updateState]);

    return { gameState, validMoves, handleRollDice, handleMoveToken, isRolling };
}
