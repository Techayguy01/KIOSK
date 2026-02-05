require('dotenv').config();
const { Pool } = require('pg');

// Create a unified pool for the application
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test the connection on startup
pool.on('connect', () => {
    console.log('🔌 Database connected successfully');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;