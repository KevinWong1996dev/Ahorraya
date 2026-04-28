require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('./db');
const logger = require('../utils/logger');

const UPDATES = [
  { nombre: 'Leche Entera La Lechera 1L',        peso_neto: '1L',    unidad: 'L' },
  { nombre: 'Arroz Superior Gustadina 5Kg',       peso_neto: '5kg',   unidad: 'kg' },
  { nombre: 'Aceite La Favorita 1L',              peso_neto: '1L',    unidad: 'L' },
  { nombre: 'Azúcar Valdez 2Kg',                  peso_neto: '2kg',   unidad: 'kg' },
  { nombre: 'Pan de Molde Bimbo 500g',            peso_neto: '500g',  unidad: 'g' },
  { nombre: 'Huevos Pronaca 12 unidades',         peso_neto: '12u',   unidad: 'unidad' },
  { nombre: 'Atún en Agua Real 180g',             peso_neto: '180g',  unidad: 'g' },
  { nombre: 'Jabón Bonux 900g',                   peso_neto: '900g',  unidad: 'g' },
  { nombre: 'Shampoo Head & Shoulders 400ml',     peso_neto: '400ml', unidad: 'ml' },
  { nombre: 'Coca-Cola 2L',                       peso_neto: '2L',    unidad: 'L' },
  { nombre: 'Pasta Corona 400g',                  peso_neto: '400g',  unidad: 'g' },
  { nombre: 'Sal Cris-Sal 1Kg',                   peso_neto: '1kg',   unidad: 'kg' },
  { nombre: 'Papel Higiénico Scott x4 rollos',    peso_neto: '4u',    unidad: 'rollo' },
  { nombre: 'Yogur Toni Natural 180g',            peso_neto: '180g',  unidad: 'g' },
  { nombre: 'Pollo Entero Pronaca 1Kg',           peso_neto: '~1kg',  unidad: 'kg' },
  { nombre: 'Lenteja Aliada 500g',                peso_neto: '500g',  unidad: 'g' },
  { nombre: 'Tomate de Riñón 1Kg',               peso_neto: '~1kg',  unidad: 'kg' },
  { nombre: 'Cebolla Paiteña 1Kg',               peso_neto: '~1kg',  unidad: 'kg' },
  { nombre: 'Detergente Ariel 900g',              peso_neto: '900g',  unidad: 'g' },
  { nombre: 'Mantequilla Klar 200g',              peso_neto: '200g',  unidad: 'g' },
];

async function fix() {
  try {
    logger.info('🔄 Actualizando peso_neto y unidad de productos existentes...');
    let updated = 0;
    for (const u of UPDATES) {
      const res = await query(
        `UPDATE productos SET peso_neto=$1, unidad=$2 WHERE nombre ILIKE $3`,
        [u.peso_neto, u.unidad, `%${u.nombre.split(' ').slice(0,3).join(' ')}%`]
      );
      if (res.rowCount > 0) updated++;
    }
    logger.info(`✅ ${updated} productos actualizados`);
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error:', err.message);
    process.exit(1);
  }
}
fix();
