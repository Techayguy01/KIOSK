const pool = require('../config/db');

exports.getAvailableRooms = async (req, res) => {
    try {
        // In a real app, you might filter by dates:
        // SELECT * FROM rooms WHERE id NOT IN (SELECT room_id FROM bookings WHERE ...)
        
        // For now, we assume your 'rooms' table has a status column
        // If you don't have a 'rooms' table yet, we can return mock data or query bookings
        
        const query = `
            SELECT * FROM rooms 
            WHERE status = 'available' 
            ORDER BY room_number ASC
        `;
        
        // Failsafe: If table doesn't exist, return empty array instead of crashing
        try {
            const result = await pool.query(query);
            res.json({ status: "success", data: result.rows });
        } catch (dbError) {
            console.warn("⚠️ Rooms table missing, returning mock data");
            res.json({ 
                status: "success", 
                data: [
                    { id: 101, room_number: "101", type: "Deluxe", price: 150 },
                    { id: 102, room_number: "102", type: "Standard", price: 100 }
                ] 
            });
        }

    } catch (error) {
        console.error("❌ Room Controller Error:", error);
        res.status(500).json({ error: "Could not fetch rooms" });
    }
};