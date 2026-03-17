import { describe, it, expect } from 'vitest';
import { GameState, GamePhase, TokenState } from './GameState';
import { MoveValidator } from './MoveValidator';
import { ENTRY_ROLL, Zone } from './BoardConfig';

describe('Ludo Engine', () => {
    const playerConfigs = [
        { id: '1', name: 'Player 1', type: 'HUMAN' },
        { id: '2', name: 'Player 2', type: 'HUMAN' }
    ];

    describe('GameState', () => {
        it('should create initial state with 2-4 players', () => {
            const state = GameState.create(playerConfigs);
            expect(state.players.length).toBe(2);
            expect(state.phase).toBe(GamePhase.WAITING_FOR_ROLL);
            expect(state.currentPlayerIndex).toBe(0);
        });

        it('should throw error for invalid player count', () => {
            expect(() => GameState.create([])).toThrow();
            expect(() => GameState.create([{ id: '1', name: 'P1' }])).toThrow();
        });

        it('should advance to next player and reset dice', () => {
            let state = GameState.create(playerConfigs);
            state = state.withDice({ value: 3, rolledBy: '1' });
            state = state.withNextPlayer();
            
            expect(state.currentPlayerIndex).toBe(1);
            expect(state.dice.value).toBe(null);
            expect(state.turnNumber).toBe(2);
        });
    });

    describe('MoveValidator', () => {
        it('should not allow moves in WAITING_FOR_ROLL phase', () => {
            const state = GameState.create(playerConfigs);
            const moves = MoveValidator.getValidMoves(state, '1');
            expect(moves.length).toBe(0);
        });

        it('should allow moving out of base only with an ENTRY_ROLL (6)', () => {
            let state = GameState.create(playerConfigs);
            
            // Roll a 3 - no moves possible from base
            state = state.withDice({ value: 3, rolledBy: '1' }).withPhase(GamePhase.WAITING_FOR_MOVE);
            let moves = MoveValidator.getValidMoves(state, '1');
            expect(moves.length).toBe(0);

            // Roll a 6 - can move out of base
            state = state.withDice({ value: ENTRY_ROLL, rolledBy: '1' });
            moves = MoveValidator.getValidMoves(state, '1');
            expect(moves.length).toBe(4); // All 4 tokens can move
            expect(moves[0].to.zone).toBe(Zone.MAIN_TRACK);
        });

        it('should detect when no moves are possible', () => {
            let state = GameState.create(playerConfigs);
            // All tokens in base, rolled a 2
            state = state.withDice({ value: 2, rolledBy: '1' }).withPhase(GamePhase.WAITING_FOR_MOVE);
            expect(MoveValidator.hasValidMoves(state, '1')).toBe(false);
        });
    });
});
