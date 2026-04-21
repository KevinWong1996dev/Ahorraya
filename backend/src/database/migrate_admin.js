require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('./db');
const logger = require('../utils/logger');

const SCHEMA = `
-- Agregar rol a usuarios (admin / user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'));

-- Log de acciones del admin
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50),
  entidad_id UUID,
  detalle JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function migrate() {
  try {
    logger.info('🔄 Ejecutando migración admin...');
    await query(SCHEMA);
    logger.info('✅ Migración admin completada');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrate();
