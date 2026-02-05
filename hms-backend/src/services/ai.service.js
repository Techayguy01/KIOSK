require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs-extra');

// Initialize Groq Client
const groq = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1" 
});

// Initialize OpenAI Client (For Vision/ID Scan - Groq Vision is currently limited)
// If you don't have an OpenAI key, we can use Groq for text only, but ID scan needs Vision.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy_key" });

module.exports = {
    // 1. SPEECH TO TEXT (Whisper)
    async transcribeAudio(filePath) {
        try {
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-large-v3",
                response_format: "json",
                language: "en"
            });
            return transcription.text;
        } catch (error) {
            console.error("❌ STT Error:", error);
            throw new Error("Failed to transcribe audio");
        }
    },

    // 2. TEXT GENERATION (Llama 3)
    async generateResponse(systemPrompt, userText) {
        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant", 
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ],
            });
            return completion.choices[0].message.content;
        } catch (error) {
            console.error("❌ LLM Error:", error);
            return "I am having trouble thinking right now. Please try again.";
        }
    },

    // 3. VISION (ID Card Scanning)
    async extractIDData(imageBuffer) {
        try {
            const base64Image = imageBuffer.toString('base64');
            const response = await openai.chat.completions.create({
                model: "gpt-4o", // Strongest vision model for OCR
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Extract the 'full_name' and 'document_number' from this ID card. Return ONLY valid JSON." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                        ],
                    },
                ],
                response_format: { type: "json_object" }
            });
            return JSON.parse(response.choices[0].message.content);
        } catch (error) {
            console.error("❌ Vision Error:", error);
            throw new Error("Failed to scan ID card");
        }
    }
};