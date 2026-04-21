require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('./db');
const logger = require('../utils/logger');

async function migrate() {
  try {
    logger.info('🔄 Aplicando fixes...');

    // Fix 1: Agregar 'admin' al constraint de fuente
    await query(`
      ALTER TABLE precios DROP CONSTRAINT IF EXISTS precios_fuente_check;
      ALTER TABLE precios ADD CONSTRAINT precios_fuente_check
        CHECK (fuente IN ('scraper', 'crowdsourcing', 'api_oficial', 'admin'));
    `);
    logger.info('✅ Constraint fuente actualizado');

    // Fix 2: Crear tabla categorias si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nombre VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Insertar categorías por defecto
    const cats = [
      'Lácteos','Granos y Cereales','Aceites y Condimentos','Azúcares y Endulzantes',
      'Panadería','Huevos y Lácteos','Conservas','Limpieza del Hogar','Cuidado Personal',
      'Bebidas','Pastas y Fideos','Condimentos','Higiene','Carnes y Aves',
      'Frutas y Verduras','Snacks','Congelados','Mascotas','Bebés','Farmacia',
      'Electrodomésticos','Otros'
    ];
    for (const nombre of cats) {
      await query(`INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING`, [nombre]);
    }
    logger.info(`✅ ${cats.length} categorías listas`);

    logger.info('✅ Todos los fixes aplicados');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error:', err.message);
    process.exit(1);
  }
}
migrate();
