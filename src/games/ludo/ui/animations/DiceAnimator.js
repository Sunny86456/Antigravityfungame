/**
 * Dice Animator
 * 
 * Manages dice roll animations.
 * visualizes "rolling" by rapidly changing random values.
 */

import { Tween } from './AnimationManager.js';

export class DiceAnimator {
    constructor(animationManager) {
        this.manager = animationManager;
        this.animatingDice = null; // { val: number } or null
        this.isRolling = false;
    }

    /**
     * Animate dice roll
     * @param {number} finalValue - result from engine
     * @param {Function} onComplete - callback
     */
    roll(finalValue, onComplete) {
        this.isRolling = true;
        this.animatingDice = { val: 1 };

        const duration = 500; // 500ms total
        let lastSwitch = 0;
        const switchInterval = 60; // Change face every 60ms

        // Custom animation object
        const rollAnim = {
            elapsed: 0,
            update: (dt) => {
                this.elapsed += dt;
                lastSwitch += dt;

                if (lastSwitch > switchInterval) {
                    lastSwitch = 0;
                    // Random face 1-6
                    this.animatingDice.val = Math.floor(Math.random() * 6) + 1;
                }

                if (this.elapsed >= duration) {
                    this.animatingDice.val = finalValue;
                    this.isRolling = false;
                    if (onComplete) onComplete();
                    return true; // Finished
                }
                return false;
            }
        };
        // Initialize elapsed
        rollAnim.elapsed = 0;

        this.manager.add(rollAnim);
    }

    /**
     * Get override value for dice
     */
    getValue() {
        return this.isRolling && this.animatingDice ? this.animatingDice.val : null;
    }

    isAnimating() {
        return this.isRolling;
    }
}
