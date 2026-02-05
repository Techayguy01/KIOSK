require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
const gTTS = require('gtts');
const { Pool } = require('pg');

const app = express();
const PORT = 8000;

// --- CONFIGURATION ---
const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'public')));
fs.ensureDirSync(path.join(__dirname, 'public'));
const upload = multer({ dest: 'uploads/' });

// --- POSTGRESQL DATABASE ---
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Test DB connection on startup
pool.query('SELECT NOW()')
    .then(() => console.log('✅ PostgreSQL Connected'))
    .catch(err => console.error('❌ PostgreSQL Error:', err.message));

// ============================================
// DEVICE GUARD: Authenticate Kiosk Device
// ============================================
async function authenticateDevice(serialNumber) {
    if (!serialNumber) return { authorized: false, reason: 'No serial number provided' };

    try {
        const result = await pool.query(
            `SELECT d.*, h.name as hotel_name 
             FROM kiosk_sys.devices d 
             JOIN public.hotels h ON d.hotel_id = h.id 
             WHERE d.serial_number = $1`,
            [serialNumber]
        );

        if (result.rows.length === 0) return { authorized: false, reason: 'Device not registered' };

        const device = result.rows[0];
        if (device.status === 'offline') return { authorized: false, reason: 'Device is offline' };

        await pool.query('UPDATE kiosk_sys.devices SET last_heartbeat = NOW() WHERE serial_number = $1', [serialNumber]);

        return { authorized: true, device };
    } catch (err) {
        console.error('Device Auth Error:', err.message);
        return { authorized: false, reason: 'Database error' };
    }
}

// ============================================
// DATABASE ACTIONS (CRUD)
// ============================================

// 1. READ / CHECK-IN
async function getBookingDetails(bookingId, hotelId) {
    try {
        const result = await pool.query(
            'SELECT * FROM bookings WHERE booking_id = $1 AND hotel_id = $2',
            [bookingId, hotelId]
        );
        if (result.rows.length > 0) {
            const booking = result.rows[0];
            // Auto check-in if confirmed
            if (booking.status === 'confirmed') {
                await pool.query(
                    'UPDATE bookings SET status = $1 WHERE booking_id = $2',
                    ['checked_in', bookingId]
                );
                booking.status = 'checked_in';
                return { success: true, data: booking, msg: "Check-in successful" };
            }
            return { success: true, data: booking, msg: "Already checked in" };
        }
        return { success: false, msg: "Booking not found" };
    } catch (err) {
        return { success: false, msg: err.message };
    }
}

// 2. CREATE
async function createBooking(name, date, hotelId) {
    try {
        // Generate mock details
        const bookingId = Math.floor(1000 + Math.random() * 9000).toString();
        const roomNum = Math.floor(100 + Math.random() * 400).toString();

        await pool.query(
            'INSERT INTO bookings (booking_id, guest_name, room_number, check_in_date, hotel_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [bookingId, name, roomNum, date, hotelId, 'confirmed']
        );
        return { success: true, booking_id: bookingId, room: roomNum };
    } catch (err) {
        return { success: false, msg: err.message };
    }
}

// 3. CANCEL
async function cancelBooking(bookingId, hotelId) {
    try {
        const result = await pool.query(
            "UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1 AND hotel_id = $2 RETURNING *",
            [bookingId, hotelId]
        );
        return result.rows.length > 0
            ? { success: true }
            : { success: false, msg: "Booking not found" };
    } catch (err) {
        return { success: false, msg: err.message };
    }
}

// --- HELPER: AUDIO GEN ---
const generateAudioFree = (text, filepath) => {
    return new Promise((resolve, reject) => {
        try {
            const gtts = new gTTS(text, 'en');
            gtts.save(filepath, (err) => {
                if (err) reject(err); else resolve(filepath);
            });
        } catch (e) { reject(e); }
    });
};

// ============================================
// API ENDPOINT: Voice Agent
// ============================================
app.post('/api/v1/voice', upload.single('audio_blob'), async (req, res) => {
    console.log("\n--- 🎤 NEW REQUEST ---");

    // 1. Device Auth
    const serialNumber = req.body.serial_number;
    const authResult = await authenticateDevice(serialNumber);
    if (!authResult.authorized) return res.status(403).json({ error: authResult.reason });

    const device = authResult.device;
    const hotelName = device.config?.hotel_name || device.hotel_name;
    const hotelId = device.hotel_id;

    if (!req.file) return res.status(400).json({ error: "No audio file" });
    let audioPath = req.file.path + '.wav';

    try {
        await fs.rename(req.file.path, audioPath);

        // 2. STT (Listen)
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-large-v3",
            response_format: "json",
            language: "en"
        });
        const userText = transcription.text;
        console.log("🗣️ User:", userText);

        // 3. DECISION ENGINE (LLM)
        const currentDate = new Date().toISOString().split('T')[0];

        const systemPrompt = `You are a smart Hotel Kiosk Assistant at ${hotelName}.
Current Date: ${currentDate}

Your goal is to HELP the user by taking ACTIONS.
You must output a JSON object describing the User's Intent.

AVAILABLE ACTIONS:
1. "check_in" -> User says "Check in", "I have a booking", etc. Needs "booking_id" (extract 4 digits).
2. "create_booking" -> User says "Book a room", "I need a reservation". Needs "name" and "date" (YYYY-MM-DD). Default date: ${currentDate} if user says "today".
3. "cancel_booking" -> User says "Cancel my booking". Needs "booking_id".
4. "chat" -> General conversation, greetings, questions.

OUTPUT FORMAT (JSON ONLY):
{
  "action": "check_in" | "create_booking" | "cancel_booking" | "chat",
  "data": { ...extracted parameters... },
  "response": "Short text response to user (only for 'chat' action)"
}

Examples:
- "Check in with 1001" -> {"action": "check_in", "data": {"booking_id": "1001"}}
- "Book a room for Sarah tomorrow" -> {"action": "create_booking", "data": {"name": "Sarah", "date": "2026-02-05"}}
- "Hello" -> {"action": "chat", "response": "Welcome to ${hotelName}! How can I help?"}
`;

        const completion = await openai.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userText }
            ],
            response_format: { type: "json_object" }
        });

        const llmJson = JSON.parse(completion.choices[0].message.content);
        console.log("🧠 Intent:", llmJson);

        let finalResponse = "";

        // 4. EXECUTE ACTIONS
        if (llmJson.action === 'check_in') {
            const bookingId = llmJson.data?.booking_id;
            if (!bookingId) {
                finalResponse = "I need your 4-digit booking ID to check you in.";
            } else {
                const res = await getBookingDetails(bookingId, hotelId);
                if (res.success) {
                    finalResponse = `Welcome Back, ${res.data.guest_name}! You are checked in. Room ${res.data.room_number}.`;
                } else {
                    finalResponse = `I couldn't find booking ${bookingId}. Please check the number.`;
                }
            }
        }
        else if (llmJson.action === 'create_booking') {
            const { name, date } = llmJson.data || {};
            if (!name) {
                finalResponse = "I need a name to make the booking.";
            } else {
                const res = await createBooking(name, date || currentDate, hotelId);
                if (res.success) {
                    finalResponse = `Booking confirmed for ${name}. Your Booking ID is ${res.booking_id}. Room ${res.room}.`;
                } else {
                    finalResponse = "Sorry, I couldn't create the booking right now.";
                }
            }
        }
        else if (llmJson.action === 'cancel_booking') {
            const bookingId = llmJson.data?.booking_id;
            if (!bookingId) {
                finalResponse = "Please provide the booking ID to cancel.";
            } else {
                const res = await cancelBooking(bookingId, hotelId);
                if (res.success) {
                    finalResponse = `Booking ${bookingId} has been cancelled.`;
                } else {
                    finalResponse = `I couldn't find active booking ${bookingId}.`;
                }
            }
        }
        else {
            // Chat or Fallback
            finalResponse = llmJson.response || "I didn't capture that. Could you repeat?";
        }

        console.log("🤖 Reply:", finalResponse);

        // 5. TTS (Speak)
        const audioFileName = `response_${Date.now()}.mp3`;
        const audioFilePath = path.join(__dirname, 'public', audioFileName);

        try {
            await generateAudioFree(finalResponse, audioFilePath);
            const audioUrl = `http://localhost:${PORT}/audio/${audioFileName}`;

            res.json({
                status: "success",
                data: {
                    transcript: userText,
                    text_response: finalResponse,
                    audio_url: audioUrl,
                    hotel: hotelName
                }
            });
        } catch (e) {
            console.error("TTS Error", e);
            res.json({ status: "success", data: { transcript: userText, text_response: finalResponse, audio_url: null, hotel: hotelName } });
        }

        await fs.unlink(audioPath);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`🚀 Voice Agent (CRUD) running on port ${PORT}`));