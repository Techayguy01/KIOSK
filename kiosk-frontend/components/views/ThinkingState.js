"use client";
import React, { useState, useEffect } from "react";
import "./ThinkingState.css";

/**
 * ThinkingState: Manages perceived latency through "Information Snacking".
 * Keeps the guest engaged while the Postman Mock Brain processes the audio.
 */
const ThinkingState = () => {
    const [tipIndex, setTipIndex] = useState(0);

    const tips = [
        { title: "Wi-Fi Access", detail: "Network: Grand_Guest | Pass: Welcome2026" },
        { title: "Breakfast Hours", detail: "7:00 AM - 10:30 AM at the Sunrise Cafe" },
        { title: "Pool & Gym", detail: "Located on the 2nd Floor | Open 24/7" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % tips.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="thinking-container">
            <div className="loader-section">
                <div className="ai-brain-loader">
                    <div className="orbit"></div>
                    <div className="inner-core"></div>
                </div>
                <h1>Jarvis is thinking...</h1>
            </div>

            <div className="info-snacking-card">
                <p className="tip-label">Did you know?</p>
                <h3 className="tip-title">{tips[tipIndex].title}</h3>
                <p className="tip-detail">{tips[tipIndex].detail}</p>
            </div>
        </div>
    );
};

export default ThinkingState;
