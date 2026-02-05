require('dotenv').config();
const app = require('./src/app');
const fs = require('fs-extra');
const path = require('path');

const PORT = process.env.PORT || 8000;

// Ensure public folder exists for audio files
const publicDir = path.join(__dirname, 'public');
fs.ensureDirSync(publicDir);

app.listen(PORT, () => {
    console.log(`\n🚀 KIOSK BACKEND RUNNING`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📂 Audio: http://localhost:${PORT}/audio`);
});