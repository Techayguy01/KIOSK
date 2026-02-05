const fs = require('fs-extra');
const path = require('path');
const gTTS = require('gtts');
const pool = require('../config/db');
const aiService = require('../services/ai.service');

// Helper: Generate TTS Audio
const generateTTS = (text, outputDir) => {
    return new Promise((resolve, reject) => {
        const fileName = `response_${Date.now()}.mp3`;
        const filePath = path.join(outputDir, fileName);
        
        const gtts = new gTTS(text, 'en');
        gtts.save(filePath, (err) => {
            if (err) reject(err);
            else resolve(fileName);
        });
    });
};

exports.processVoice = async (req, res) => {
    console.log("\n--- 🎤 New Voice Request ---");
    
    // 1. VALIDATION
    if (!req.file) return res.status(400).json({ error: "No audio file received" });

    // 2. SECURITY GATE (Check Kiosk Identity)
    // The frontend should send serial_number in req.body
    const serialNumber = req.body.serial_number || 'ATC-SN-2026-001'; // Fallback for testing
    let deviceConfig = {}; 

    try {
        const deviceCheck = await pool.query(
            "SELECT * FROM kiosk_sys.devices WHERE serial_number = $1", 
            [serialNumber]
        );
        
        if (deviceCheck.rows.length === 0) {
            console.warn(`⛔ Unknown Device: ${serialNumber}`);
             // For now, we allow it to continue so you can test, but normally:
             // return res.status(403).json({ error: "Device Unauthorized" });
        } else {
            const device = deviceCheck.rows[0];
            if (device.status === 'offline') return res.status(403).json({ error: "Device is Offline" });
            deviceConfig = device.config || {};
        }

        // 3. PROCESS AUDIO (STT)
        // Rename to .wav for Groq
        const audioPath = req.file.path + '.wav';
        await fs.rename(req.file.path, audioPath);
        
        const userText = await aiService.transcribeAudio(audioPath);
        console.log("🗣️ User said:", userText);

        // 4. DATABASE LOOKUP (Booking Logic)
        let dbContext = "If the user provides a 4-digit code, check if it matches a booking.";
        
        // Simple regex for 4 digits (e.g. "1001")
        const match = userText.match(/\b\d{4}\b/);
        if (match) {
            const code = match[0];
            const booking = await pool.query(
                "SELECT * FROM bookings WHERE confirmation_code = $1", 
                [code]
            );
            
            if (booking.rows.length > 0) {
                const b = booking.rows[0];
                dbContext = `User Identified! Name: ${b.guest_name}. Room: ${b.room_number}. Status: ${b.status}. Respond warmly and welcome them.`;
                
                // Auto Check-in Logic
                if (b.status === 'confirmed') {
                    await pool.query("UPDATE bookings SET status = 'checked_in' WHERE id = $1", [b.id]);
                }
            } else {
                dbContext = `User provided code ${code}, but it was not found in the database. Ask them to check the number.`;
            }
        }

        // 5. GENERATE RESPONSE (LLM)
        const systemPrompt = `You are a helpful Hotel Kiosk Assistant at ${deviceConfig.hotel_name || "Grand Hotel"}. 
        Keep answers short (max 2 sentences). Context: ${dbContext}`;
        
        const aiText = await aiService.generateResponse(systemPrompt, userText);
        console.log("🤖 AI Replied:", aiText);

        // 6. GENERATE AUDIO (TTS)
        const publicDir = path.join(__dirname, '../../public'); // Points to hms-backend/public
        const audioFile = await generateTTS(aiText, publicDir);
        const audioUrl = `http://localhost:${process.env.PORT || 8000}/audio/${audioFile}`;

        // 7. CLEANUP & RESPOND
        await fs.unlink(audioPath); // Delete upload
        
        res.json({
            status: "success",
            data: {
                transcript: userText,
                text_response: aiText,
                audio_url: audioUrl
            }
        });

    } catch (error) {
        console.error("❌ Controller Error:", error);
        res.status(500).json({ error: "Internal Processing Error" });
    }
};