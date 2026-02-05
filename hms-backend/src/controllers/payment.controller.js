const pool = require('../config/db');

exports.processPayment = async (req, res) => {
    console.log("\n--- 💸 New Payment Request ---");
    const { booking_id, amount, payment_method } = req.body;

    try {
        if (!booking_id || !amount) {
            return res.status(400).json({ error: "Missing payment details" });
        }

        // 1. Simulate Processing Delay (e.g. talking to Stripe)
        console.log(`Processing $${amount} via ${payment_method || 'Credit Card'}...`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay

        // 2. Update Database
        // We assume 'payment_status' column exists in bookings
        await pool.query(
            "UPDATE bookings SET payment_status = 'paid', updated_at = NOW() WHERE id = $1",
            [booking_id]
        );

        // 3. Success Response
        res.json({
            status: "success",
            transaction_id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            message: "Payment Approved",
            amount_paid: amount
        });

    } catch (error) {
        console.error("❌ Payment Controller Error:", error);
        res.status(500).json({ error: "Payment Processing Failed" });
    }
};