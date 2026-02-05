"use client";
import React from "react";
import "./VoiceVisualizer.css";

/**
 * VoiceVisualizer: The "LED Language" of the Kiosk.
 * Provides real-time visual feedback during the LISTENING state.
 */
const VoiceVisualizer = ({ onStop }) => {
    return (
        <div className="voice-container">
            <div className="visualizer-content">
                <h1 className="status-label">Listening...</h1>

                {/* Pulsing Rings mimicking hardware LED feedback */}
                <div className="pulse-wrapper">
                    <div className="ring delay-1"></div>
                    <div className="ring delay-2"></div>
                    <div className="ring delay-3"></div>
                    <div className="core-mic">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    </div>
                </div>

                <p className="hint-text">"I'd like to check in..."</p>

                {/* Massive Touch Target for stopping manualy */}
                <button className="stop-button" onClick={onStop}>
                    Done Speaking
                </button>
            </div>
        </div>
    );
};

export default VoiceVisualizer;
