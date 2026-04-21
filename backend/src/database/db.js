const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false 
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err);
});

const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    logger.error('Database query error:', err);
    throw err;
  }
};

module.exports = { query, pool };