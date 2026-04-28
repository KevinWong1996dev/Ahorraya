require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('./db');
const logger = require('../utils/logger');

async function migrate() {
  try {
    logger.info('🔄 Creando tabla notificaciones...');
    await query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
        producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
        tipo VARCHAR(50) DEFAULT 'precio_bajo',
        mensaje TEXT NOT NULL,
        precio_nuevo DECIMAL(10,2),
        precio_anterior DECIMAL(10,2),
        leida BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id, leida, created_at DESC)`);
    logger.info('✅ Tabla notificaciones lista');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error:', err.message);
    process.exit(1);
  }
}
migrate();
