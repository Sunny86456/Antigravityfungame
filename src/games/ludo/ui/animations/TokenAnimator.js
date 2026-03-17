/**
 * Token Animator
 * 
 * Manages active token move animations.
 * Provides override positions for TokenRenderer.
 */

import { Tween } from './AnimationManager.js';
import { CoordinateMapper } from '../CoordinateMapper.js';
import { Board } from '../../engine/Board.js';

export class TokenAnimator {
    constructor(animationManager) {
        this.manager = animationManager;
        this.activeAnimations = new Map(); // tokenId -> { x, y, scale, opacity }
    }

    /**
     * Start animation for a token move
     * @param {string} tokenId
     * @param {string} playerColor
     * @param {object} from - { zone, position }
     * @param {object} to - { zone, position }
     * @param {number} diceValue - Value rolled (total steps)
     * @param {Function} [onComplete] - Callback on completion
     */
    animateMove(tokenId, playerColor, from, to, diceValue, onComplete) {
        // Generate path points
        // We pass '6' usually as diceValue heuristic, so we need 'to' to stop early.
        const path = this._generatePath(from, diceValue, playerColor, to);

        if (path.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        const durationPerStep = 120; // 120ms per cell
        const totalDuration = (path.length - 1) * durationPerStep; // steps = points - 1

        // Initial state
        const startState = path[0]; // { x, y } (grid coords)
        const animState = {
            x: startState.x,
            y: startState.y,
            scale: 1,
            opacity: 1
        };
        this.activeAnimations.set(tokenId, animState);

        const tween = new Tween({
            duration: totalDuration,
            ease: 'linear',
            onUpdate: (progress) => {
                // If progress is 1, snap to end
                if (progress >= 1) {
                    const last = path[path.length - 1];
                    animState.x = last.x;
                    animState.y = last.y;
                    return;
                }

                const totalSegments = path.length - 1;
                const virtualProgress = progress * totalSegments;
                const segmentIndex = Math.floor(virtualProgress);
                const segmentProgress = virtualProgress - segmentIndex;

                const p1 = path[segmentIndex];
                const p2 = path[segmentIndex + 1];

                if (p1 && p2) {
                    animState.x = p1.x + (p2.x - p1.x) * segmentProgress;
                    animState.y = p1.y + (p2.y - p1.y) * segmentProgress;
                }
            },
            onComplete: () => {
                this.activeAnimations.delete(tokenId);
                if (onComplete) onComplete();
            }
        });

        this.manager.add(tween);
    }

    /**
     * Animate capture (Shake and Fade)
     * 
     * @param {string} tokenId
     * @param {number} deathPositionGridIdx - The main track position where death occurred
     * @param {string} playerColor
     * @param {Function} [onComplete]
     */
    animateCaptureEffect(tokenId, deathPositionGridIdx, playerColor, onComplete) {
        // Find screen coords for the death position
        // Captures happen on MAIN_TRACK
        const coords = CoordinateMapper.getGridCoordinates('MAIN_TRACK', deathPositionGridIdx, playerColor);

        const animState = {
            x: coords.x,
            y: coords.y,
            scale: 1,
            opacity: 1
        };
        this.activeAnimations.set(tokenId, animState);

        // Shake phase (300ms) then Fade phase (300ms)
        const shakeDuration = 300;
        const fadeDuration = 300;
        const totalDuration = shakeDuration + fadeDuration;

        const tween = new Tween({
            duration: totalDuration,
            ease: 'linear',
            onUpdate: (progress) => {
                const time = progress * totalDuration;

                if (time < shakeDuration) {
                    // Shake intensity decreases
                    const remainingShake = 1 - (time / shakeDuration);
                    const shakeAmount = 0.15 * remainingShake;
                    animState.x = coords.x + (Math.random() - 0.5) * shakeAmount;
                    animState.y = coords.y + (Math.random() - 0.5) * shakeAmount;
                } else {
                    // Reset position, fade out
                    animState.x = coords.x;
                    animState.y = coords.y;

                    const fadeProgress = (time - shakeDuration) / fadeDuration;
                    animState.scale = 1 - fadeProgress * 0.5; // Shrink to 50%
                    animState.opacity = 1 - fadeProgress;
                }
            },
            onComplete: () => {
                this.activeAnimations.delete(tokenId);
                if (onComplete) onComplete();
            }
        });

        this.manager.add(tween);
    }

    /**
     * Animate finish (Scale down and vanish)
     */
    animateFinish(tokenId, finalGridPos, onComplete) {
        const animState = {
            x: finalGridPos.x,
            y: finalGridPos.y,
            scale: 1,
            opacity: 1
        };
        this.activeAnimations.set(tokenId, animState);

        const tween = new Tween({
            duration: 500,
            ease: 'easeInBack',
            onUpdate: (progress) => {
                animState.scale = 1 - progress;
                animState.opacity = 1 - progress;
            },
            onComplete: () => {
                this.activeAnimations.delete(tokenId);
                if (onComplete) onComplete();
            }
        });

        this.manager.add(tween);
    }

    /**
     * Generate list of grid coordinates for the path
     * @private
     */
    _generatePath(startState, steps, color, destination) {
        const path = [];

        let currentZone = startState.zone;
        let currentPos = startState.position;

        // Path always includes start point
        path.push(CoordinateMapper.getGridCoordinates(currentZone, currentPos, color));

        // Simulate 1 step at a time
        for (let i = 0; i < steps; i++) {
            // Check if we already reached destination (before taking this step? No, we are at current)
            if (destination && currentZone === destination.zone && currentPos === destination.position) {
                break;
            }

            const result = Board.calculateNextPosition({
                currentZone,
                currentPosition: currentPos,
                diceValue: 1, // Only 1 step
                color
            });

            if (result.isValidMove) {
                currentZone = result.nextZone;
                currentPos = result.nextPosition;
                path.push(CoordinateMapper.getGridCoordinates(currentZone, currentPos, color));

                // Check if we reached destination AFTER this step
                if (destination && currentZone === destination.zone && currentPos === destination.position) {
                    break;
                }
            } else {
                break;
            }
        }

        return path;
    }

    /**
     * Get animation override for a token if active
     * @param {string} tokenId 
     * @returns {object|null} { x, y, scale, opacity } (Grid Coords)
     */
    getOverride(tokenId) {
        return this.activeAnimations.get(tokenId) || null;
    }
}
