require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('./db');
const logger = require('../utils/logger');

async function seedAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@ahorraya.ec';
    const password = process.env.ADMIN_PASSWORD || 'Admin2025!';
    const nombre = 'Administrador';

    const hash = await bcrypt.hash(password, 12);

    await query(`
      INSERT INTO users (email, password_hash, nombre, role, puntos, nivel)
      VALUES ($1, $2, $3, 'superadmin', 0, 'maestro')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'superadmin'
    `, [email, hash, nombre]);

    logger.info(`✅ Admin creado: ${email} / ${password}`);
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
