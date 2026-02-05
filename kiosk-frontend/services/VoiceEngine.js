/**
 * VoiceEngine - Audio management service layer
 * Features:
 * - Simple play/stop interface
 * - Singleton pattern for global audio control
 */

class VoiceEngineService {
    constructor() {
        this.currentAudio = null;
    }

    play(url) {
        this.stop();
        console.log("🔊 VoiceEngine Playing:", url);

        this.currentAudio = new Audio(url);
        this.currentAudio.play().catch(err => {
            console.error("Audio playback failed:", err);
        });

        this.currentAudio.onended = () => {
            this.currentAudio = null;
        };
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }

    // Sound effects (optional, keeping for future use)
    playTapSound() {
        // Placeholder for tap sound
    }

    playSuccessSound() {
        // Placeholder for success sound
    }

    playErrorSound() {
        // Placeholder for error sound
    }
}

// Export singleton instance
const VoiceEngine = new VoiceEngineService();
export default VoiceEngine;
