/**
 * Ludo Engine - Public API
 * 
 * Export everything needed to use the Ludo game engine.
 */

// Main entry points
export { createGame, loadGame } from './LudoGame.js';
export { CoinRewardSystem } from './CoinRewardSystem.js';

// Engine Classes (for types & static methods)
export { GameState } from './GameState.js';
export { Board } from './Board.js';
export { Dice } from './Dice.js';
export { TurnManager } from './TurnManager.js';
export { MoveValidator } from './MoveValidator.js';
export { MoveExecutor } from './MoveExecutor.js';

// Types and enums
export {
    GamePhase,
    TokenState,
    PlayerType,
    PlayerColor,
    GameEventType,
    NextAction
} from './types.js';

// Constants
export {
    MAIN_TRACK_SIZE,
    HOME_PATH_LENGTH,
    TOKENS_PER_PLAYER,
    COLORS,
    START_POSITIONS,
    HOME_ENTRANCES,
    SAFE_CELLS
} from './BoardConfig.js';
