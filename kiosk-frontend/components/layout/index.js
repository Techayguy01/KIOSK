"use client";
import React from "react";
import "./layout.css";

/**
 * KioskContainer: The physical-to-digital bridge.
 * Sets the 24" vertical aspect ratio and background.
 */
export const KioskContainer = ({ children, onReset }) => {
    return (
        <main className="kiosk-shell">
            {/* Hidden reset trigger for staff (Top Left) */}
            <div className="staff-trigger" onClick={onReset}></div>
            <div className="kiosk-content">
                {children}
            </div>
            <div className="kiosk-footer">
                <p>Jarvis v1.0 • Secure Session</p>
            </div>
        </main>
    );
};

/**
 * SessionHeader: The navigation "Compass".
 * Follows the Wizard Pattern to reduce cognitive load.
 */
export const SessionHeader = ({ step, totalSteps, label }) => {
    const progress = (step / totalSteps) * 100;

    return (
        <header className="session-header">
            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="header-meta">
                <span className="step-count">Step {step} of {totalSteps}</span>
                <h3 className="view-label">{label}</h3>
            </div>
        </header>
    );
};
