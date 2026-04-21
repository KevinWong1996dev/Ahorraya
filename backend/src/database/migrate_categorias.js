require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('./db');
const logger = require('../utils/logger');

const CATEGORIAS_DEFAULT = [
  'Lácteos','Granos y Cereales','Aceites y Condimentos','Azúcares y Endulzantes',
  'Panadería','Huevos y Lácteos','Conservas','Limpieza del Hogar','Cuidado Personal',
  'Bebidas','Pastas y Fideos','Condimentos','Higiene','Carnes y Aves',
  'Frutas y Verduras','Snacks','Congelados','Mascotas','Bebés','Farmacia',
  'Electrodomésticos','Otros'
];

async function migrate() {
  try {
    logger.info('🔄 Creando tabla categorías...');
    await query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    for (const nombre of CATEGORIAS_DEFAULT) {
      await query(`INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`, [nombre]);
    }
    logger.info(`✅ ${CATEGORIAS_DEFAULT.length} categorías creadas`);
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error:', err.message);
    process.exit(1);
  }
}
migrate();
