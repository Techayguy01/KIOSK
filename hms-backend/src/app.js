const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Routes (We will create these next)
const voiceRoutes = require('./routes/voice.routes');
const identityRoutes = require('./routes/identity.routes');
const roomRoutes = require('./routes/room.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Audio Files (for TTS playback)
// This points to the 'public' folder inside hms-backend
app.use('/audio', express.static(path.join(__dirname, '../public')));

// --- API ROUTES ---
app.use('/api/v1/voice', voiceRoutes);       // 1. Voice Session
app.use('/api/v1/identity', identityRoutes); // 2. Identity Verification
app.use('/api/v1/rooms', roomRoutes);        // 3. Room Availability
app.use('/api/v1/payments', paymentRoutes);  // 4. Payment Processing

// Health Check (Good for Docker)
app.get('/health', (req, res) => res.send('OK'));

module.exports = app;