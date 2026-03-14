/**
 * Turn Highlighter
 * 
 * Manages the visual pulse/glow for the active player.
 */

export class TurnHighlighter {
    constructor(animationManager) {
        this.manager = animationManager;
        this.time = 0;
        this.active = true;

        // Add a permanent loop for pulse
        this.manager.add({
            update: (dt) => {
                if (!this.active) return false;
                this.time += dt / 1000; // seconds
                return false; // never ends automatically
            }
        });
    }

    /**
     * Get current pulse opacity (0.3 to 0.7)
     */
    getPulseOpacity() {
        // Sine wave oscillating between 0.3 and 0.7
        // Center 0.5, Amplitude 0.2
        // Speed factor 3
        return 0.5 + Math.sin(this.time * 3) * 0.2;
    }

    setActive(isActive) {
        this.active = isActive;
    }
}
