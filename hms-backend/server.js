require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const OpenAI = require('openai');
const gTTS = require('gtts');

const app = express();
const PORT = 8000;

// 1. SAFE CONFIGURATION
if (!process.env.GROQ_API_KEY) {
    console.error("❌ CRITICAL ERROR: GROQ_API_KEY is missing in .env file!");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'public')));

// Ensure public folder exists on startup
fs.ensureDirSync(path.join(__dirname, 'public'));
const upload = multer({ dest: 'uploads/' });

// HELPER: Generate Audio
const generateAudioFree = (text, filepath) => {
    return new Promise((resolve, reject) => {
        try {
            const gtts = new gTTS(text, 'en');
            gtts.save(filepath, (err) => {
                if (err) reject(err);
                else resolve(filepath);
            });
        } catch (e) { reject(e); }
    });
};

app.post('/api/v1/voice', upload.single('audio_blob'), async (req, res) => {
    console.log("\n--- 🎤 NEW REQUEST START ---");

    // STEP 0: VALIDATE UPLOAD
    if (!req.file) {
        console.error("❌ Error: No file uploaded from Frontend");
        return res.status(400).json({ error: "No audio file received" });
    }

    let audioPath = req.file.path; // Original random name

    try {
        // --- FIX STARTS HERE: RENAME FILE TO ADD .wav ---
        // Groq requires the file to have a valid extension (.wav, .mp3, etc.)
        const newPath = req.file.path + '.wav';
        await fs.rename(req.file.path, newPath);
        audioPath = newPath; // Update variable to use the new path
        console.log("1️⃣  File saved as:", audioPath);
        // ------------------------------------------------

        // STEP 1: TRANSCRIBE (STT)
        console.log("⏳ Sending to Groq Whisper...");
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath), // Use the .wav file
            model: "whisper-large-v3",
            response_format: "json",
            language: "en"
        });
        const userText = transcription.text || "(Silence)";
        console.log("✅ User Said:", userText);

        // STEP 2: THINK (LLM)
        console.log("⏳ Sending to Groq Llama...");
        const chatCompletion = await openai.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "You are a Hotel Kiosk. Respond in 10 words or less. If the user says 'Goodbye' or 'Stop', reply with 'Goodbye' and nothing else." },
                { role: "user", content: userText }
            ],
        });
        const aiText = chatCompletion.choices[0].message.content;
        console.log("✅ AI Replied:", aiText);

        // STEP 3: SPEAK (TTS)
        const audioFileName = `response_${Date.now()}.mp3`;
        const audioFilePath = path.join(__dirname, 'public', audioFileName);
        let audioUrl = null;

        try {
            console.log("⏳ Generating Audio...");
            await generateAudioFree(aiText, audioFilePath);
            audioUrl = `http://localhost:${PORT}/audio/${audioFileName}`;
            console.log("✅ Audio Ready:", audioUrl);
        } catch (ttsErr) {
            console.error("⚠️ TTS Failed (Skipping audio):", ttsErr.message);
        }

        // CLEANUP: Delete the temp .wav file
        await fs.unlink(audioPath);

        res.json({
            status: "success",
            data: {
                transcript: userText,
                text_response: aiText,
                audio_url: audioUrl
            }
        });

    } catch (error) {
        console.error("❌ SERVER CRASHED AT STEP:", error.message);

        // Detailed error for debugging
        if (error.response) console.error("Groq API Error Data:", error.response.data);

        // Cleanup file if it exists (try both original and new path)
        if (await fs.pathExists(audioPath)) await fs.unlink(audioPath);
        if (req.file && await fs.pathExists(req.file.path)) await fs.unlink(req.file.path);

        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));