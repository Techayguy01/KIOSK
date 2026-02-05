"use client";
import React, { useState } from "react";
import "./PaymentBridge.css";

/**
 * PaymentBridge: The "Secure Layer" of the Kiosk.
 * Focuses on trust signals and hardware-software symbiosis (NFC/Card).
 */
const PaymentBridge = ({ onFinish }) => {
    const [paymentStatus, setPaymentStatus] = useState("READY"); // READY, PROCESSING, SUCCESS

    const handlePayment = () => {
        setPaymentStatus("PROCESSING");
        // Simulate secure tokenization and HMS API payment processing
        setTimeout(() => {
            setPaymentStatus("SUCCESS");
            setTimeout(() => onFinish(), 2000);
        }, 4000);
    };

    return (
        <div className="payment-card">
            <div className="payment-header">
                <h2>Secure Payment</h2>
                <p>Total Amount: <strong>$198.00</strong></p>
            </div>

            <div className="payment-methods">
                <div className="method-icon nfc-icon">
                    <span>Tap Phone or Card</span>
                </div>
                <div className="divider">OR</div>
                <p className="instruction">Insert card into the reader below</p>
            </div>

            {/* Trust Signals: Essential for guest confidence during financial entry */}
            <div className="trust-badges">
                <div className="badge">🔒 PCI-DSS Compliant</div>
                <div className="badge">✅ Secure Tokenization</div>
            </div>

            <button
                className={`pay-button ${paymentStatus}`}
                onClick={handlePayment}
                disabled={paymentStatus !== "READY"}
            >
                {paymentStatus === "READY" && "Pay Now"}
                {paymentStatus === "PROCESSING" && "Authorizing..."}
                {paymentStatus === "SUCCESS" && "Payment Approved"}
            </button>

            {paymentStatus === "PROCESSING" && (
                <div className="payment-loading-bar">
                    <div className="progress-fill"></div>
                </div>
            )}
        </div>
    );
};

export default PaymentBridge;
