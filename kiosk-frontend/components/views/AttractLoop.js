"use client";
import React from "react";
import "./AttractLoop.css";

/**
 * AttractLoop: The "Invisible Technology" entry point.
 * Mimics human eye contact by waking up on guest approach.
 */
const AttractLoop = ({ onStart }) => {
    return (
        <div className="attract-container" onClick={onStart}>
            {/* Background Ambient Video or Animation */}
            <div className="ambient-bg">
                <div className="gradient-sphere"></div>
            </div>

            <div className="content-overlay">
                <h2 className="welcome-text">Welcome to Grand Hotel</h2>

                {/* Warm CTA: Psychologically warmer than "Begin Check-In" */}
                <h1 className="cta-text">Touch to Start Your Stay</h1>

                <div className="language-hint">
                    <span>EN</span> • <span>HI</span> • <span>MR</span>
                </div>
            </div>

            {/* Touch Target visual cue */}
            <div className="touch-indicator">
                <div className="pulse-ring"></div>
            </div>
        </div>
    );
};

export default AttractLoop;
