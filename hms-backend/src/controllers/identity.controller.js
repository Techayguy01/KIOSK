const aiService = require('../services/ai.service');
const pool = require('../config/db');

exports.scanIdentity = async (req, res) => {
    console.log("\n--- 📸 New Identity Scan Request ---");

    try {
        // 1. Validate Input
        if (!req.file) return res.status(400).json({ error: "No ID image uploaded" });
        const bookingId = req.body.booking_id; // Frontend must send this!
        
        if (!bookingId) return res.status(400).json({ error: "Missing booking_id" });

        // 2. AI Vision Extraction
        // We pass the image buffer directly to our AI Service
        console.log("🔍 Analyzing ID card...");
        const idData = await aiService.extractIDData(req.file.buffer);
        console.log("📄 Extracted Data:", idData);

        // 3. Database Verification
        const bookingQuery = await pool.query(
            "SELECT * FROM bookings WHERE id = $1", 
            [bookingId]
        );

        if (bookingQuery.rows.length === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        const booking = bookingQuery.rows[0];
        const guestName = booking.guest_name.toLowerCase();
        const idName = (idData.full_name || "").toLowerCase();

        // 4. Fuzzy Matching Logic
        // We check if the ID name contains the Booking name or vice versa
        const isMatch = guestName.includes(idName) || idName.includes(guestName);

        if (isMatch) {
            // Success! Update DB to show they are verified
            await pool.query(
                "UPDATE bookings SET is_identity_verified = true WHERE id = $1",
                [bookingId]
            );
            
            return res.json({
                status: "success",
                verified: true,
                message: "Identity Verified Successfully",
                data: { name: idData.full_name, doc_number: idData.document_number }
            });
        } else {
            return res.status(401).json({
                status: "failed",
                verified: false,
                message: `Name Mismatch: Booking says '${booking.guest_name}', ID says '${idData.full_name}'`
            });
        }

    } catch (error) {
        console.error("❌ Identity Controller Error:", error);
        res.status(500).json({ error: "Identity Verification Failed" });
    }
};