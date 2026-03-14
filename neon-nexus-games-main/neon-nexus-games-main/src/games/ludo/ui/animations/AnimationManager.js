/**
 * Ludo Animation Manager
 * 
 * Central controller for all UI animations.
 * 
 * RESPONSIBILITIES:
 * - Maintain animation loop (requestAnimationFrame)
 * - Manage active animations list
 * - Provide tweening/easing functions
 */

export class AnimationManager {
    constructor(onUpdate) {
        this.animations = new Set();
        this.isRunning = false;
        this.onUpdate = onUpdate; // Callback to trigger re-render
        this.lastFrameTime = 0;
        this.boundLoop = this._loop.bind(this);
    }

    add(animation) {
        this.animations.add(animation);
        if (!this.isRunning) {
            this.start();
        }
    }

    remove(animation) {
        this.animations.delete(animation);
        if (this.animations.size === 0) {
            // Don't stop immediately if we want to keep the loop for continuous effects (like pulse)
            // But for efficiency, maybe we should?
            // TurnHighlighter adds a permanent animation, so it will keep running if active.
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.boundLoop);
    }

    stop() {
        this.isRunning = false;
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        const dt = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Update all animations
        for (const anim of this.animations) {
            // anim.update returns true if finished
            const finished = anim.update(dt);
            if (finished) {
                this.animations.delete(anim);
                if (anim.onComplete) anim.onComplete();
            }
        }

        // Trigger UI render
        if (this.onUpdate) this.onUpdate();

        // Continue loop if animations remain
        if (this.animations.size > 0) {
            requestAnimationFrame(this.boundLoop);
        } else {
            this.stop();
        }
    }
}

/**
 * Basic Tween Class
 */
export class Tween {
    constructor({ duration, onUpdate, onComplete, ease = 'linear' }) {
        this.duration = duration;
        this.onUpdateCallback = onUpdate;
        this.onComplete = onComplete;
        this.elapsed = 0;
        this.ease = ease;
    }

    update(dt) {
        this.elapsed += dt;
        let progress = Math.min(this.elapsed / this.duration, 1);

        // Apply easing
        const eased = Easing[this.ease] ? Easing[this.ease](progress) : progress;

        if (this.onUpdateCallback) this.onUpdateCallback(eased);

        return progress >= 1;
    }
}

/**
 * Easing Functions
 */
export const Easing = {
    linear: t => t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    }
};
