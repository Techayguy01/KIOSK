"use client";
import React, { useState } from "react";
import "./IdentityScanner.css";

/**
 * IdentityScanner: Support for the "Peak" friction moment.
 * Uses looping animations to guide the guest through ID verification.
 */
const IdentityScanner = ({ onComplete }) => {
    const [isScanning, setIsScanning] = useState(false);

    const handleStartScan = () => {
        setIsScanning(true);
        // Simulate OCR processing time
        setTimeout(() => {
            setIsScanning(false);
            onComplete();
        }, 5000);
    };

    return (
        <div className="scanner-card">
            <div className="scanner-header">
                <h2>Identity Verification</h2>
                <p>Please place your Passport or Photo ID on the scanner.</p>
            </div>

            <div className="scanner-visual">
                <div className={`passport-illustration ${isScanning ? "scanning" : ""}`}>
                    <div className="scanner-glass"></div>
                    <div className="passport-body"></div>
                    {isScanning && <div className="scan-laser"></div>}
                </div>
            </div>

            <div className="scanner-instructions">
                <ul>
                    <li>Face down </li>
                    <li>Align with the top-left corner </li>
                    <li>Keep still for 5 seconds </li>
                </ul>
            </div>

            <button
                className={`scan-button ${isScanning ? "disabled" : ""}`}
                onClick={handleStartScan}
                disabled={isScanning}
            >
                {isScanning ? "Scanning..." : "Begin Scan"}
            </button>
        </div>
    );
};

export default IdentityScanner;
