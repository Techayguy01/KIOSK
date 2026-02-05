"use client";
import React from "react";
import "./ServiceRecoveryAlert.css";

/**
 * ServiceRecoveryAlert: The "Empathy Layer".
 * Triggers when the Postman Mock returns an ERROR state.
 */
const ServiceRecoveryAlert = ({ message, onRetry }) => {
    return (
        <div className="error-overlay">
            <div className="error-modal">
                <div className="error-icon">!</div>

                <h2>We’re Sorry for the Wait</h2>
                <p className="error-message">{message}</p>

                <div className="recovery-action-box">
                    <p>An **Ambassador** has been notified and is coming to assist you.</p>
                    <div className="eta-badge">ETA: 2 Minutes</div>
                </div>

                <div className="button-group">
                    <button className="retry-btn" onClick={onRetry}>
                        Try Again
                    </button>
                    <button className="staff-btn">
                        Call Staff Now
                    </button>
                </div>

                <p className="hospitality-note">Your comfort is our priority.</p>
            </div>
        </div>
    );
};

export default ServiceRecoveryAlert;
