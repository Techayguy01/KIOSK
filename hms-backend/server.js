require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 8000;

// 1. MIDDLEWARE
app.use(cors()); // Allow all origins for dev
app.use(express.json());

// 2. SETUP REDIS (The Session Store)
const redisClient = createClient({ url: 'redis://localhost:6379' });
redisClient.on('error', (err) => console.log('Redis Client Error', err));
// Connect to Redis immediately
(async () => {
    try {
        await redisClient.connect();
        console.log("✅ Connected to Redis");
    } catch (e) {
        console.log("⚠️  Redis not running (Docker up?)");
    }
})();

// 3. SETUP FILE UPLOAD (Multer)
// We will store audio in memory for now to pass to AI later
const upload = multer({ storage: multer.memoryStorage() });

// 4. ROUTES

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// THE KIOSK ENDPOINT (Replaces Postman)
app.post('/api/v1/voice', upload.single('audio_blob'), async (req, res) => {
    try {
        console.log("🎤 Voice Request Received");
        
        // 1. Check if file exists
        if (!req.file) {
            console.log("❌ No audio file found");
            // For now, we allow it to proceed for testing, 
            // but in production, we would return 400.
        } else {
            console.log(`📦 Audio Size: ${req.file.size} bytes`);
        }

        const sessionId = req.body.session_id || 'unknown_session';
        
        // 2. TODO: Send req.file.buffer to OpenAI Whisper (Next Step)
        
        // 3. TODO: Send text to LLM (Next Step)

        // 4. MOCK RESPONSE (Matching your Postman Contract)
        // This makes the frontend "Happy" immediately.
        const responseData = {
            status: "success",
            data: {
                intent: "check_in",
                transcript: "I want to check in (Processed by Node.js)", 
                text_response: "Hello from the Real Backend! I received your audio.",
                audio_url: "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
                ui_action: "show_keypad"
            }
        };

        // Simulate AI Latency (1 second)
        setTimeout(() => {
            res.json(responseData);
        }, 1000);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 5. START SERVER
app.listen(PORT, () => {
    console.log(`🚀 HMS Backend running on http://localhost:${PORT}`);
});