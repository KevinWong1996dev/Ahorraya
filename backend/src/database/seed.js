require('dotenv').config({ path: '../../.env' });
const { query } = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Productos representativos de supermercados ecuatorianos
const PRODUCTOS_MOCK = [
  { nombre: 'Leche Entera La Lechera 1L', categoria: 'Lácteos', marca: 'Nestlé', unidad: 'L', peso_neto: '1L', codigo_barras: '7702001001234' },
  { nombre: 'Arroz Superior Gustadina 5Kg', categoria: 'Granos y Cereales', marca: 'Gustadina', unidad: 'kg', peso_neto: '5kg', codigo_barras: '7750244001234' },
  { nombre: 'Aceite La Favorita 1L', categoria: 'Aceites y Condimentos', marca: 'La Favorita', unidad: 'L', peso_neto: '1L', codigo_barras: '7750244002345' },
  { nombre: 'Azúcar Valdez 2Kg', categoria: 'Azúcares y Endulzantes', marca: 'Valdez', unidad: 'kg', peso_neto: '2kg', codigo_barras: '7750244003456' },
  { nombre: 'Pan de Molde Bimbo 500g', categoria: 'Panadería', marca: 'Bimbo', unidad: 'g', peso_neto: '500g', codigo_barras: '7501020003457' },
  { nombre: 'Huevos Pronaca 12 unidades', categoria: 'Huevos y Lácteos', marca: 'Pronaca', unidad: 'unidad', peso_neto: '12u', codigo_barras: '7750244004567' },
  { nombre: 'Atún en Agua Real 180g', categoria: 'Conservas', marca: 'Real', unidad: 'g', peso_neto: '180g', codigo_barras: '7750244005678' },
  { nombre: 'Jabón Bonux 900g', categoria: 'Limpieza del Hogar', marca: 'Bonux', unidad: 'g', peso_neto: '900g', codigo_barras: '8710522001234' },
  { nombre: 'Shampoo Head & Shoulders 400ml', categoria: 'Cuidado Personal', marca: 'P&G', unidad: 'ml', peso_neto: '400ml', codigo_barras: '7506306901234' },
  { nombre: 'Coca-Cola 2L', categoria: 'Bebidas', marca: 'Coca-Cola', unidad: 'L', peso_neto: '2L', codigo_barras: '7898024001234' },
  { nombre: 'Pasta Corona 400g', categoria: 'Pastas y Fideos', marca: 'Corona', unidad: 'g', peso_neto: '400g', codigo_barras: '7750244006789' },
  { nombre: 'Sal Cris-Sal 1Kg', categoria: 'Condimentos', marca: 'Cris-Sal', unidad: 'kg', peso_neto: '1kg', codigo_barras: '7750244007890' },
  { nombre: 'Papel Higiénico Scott x4 rollos', categoria: 'Higiene', marca: 'Scott', unidad: 'pack', peso_neto: '4u', codigo_barras: '7501030001234' },
  { nombre: 'Yogur Toni Natural 180g', categoria: 'Lácteos', marca: 'Toni', unidad: 'g', peso_neto: '180g', codigo_barras: '7750244008901' },
  { nombre: 'Pollo Entero Pronaca 1Kg', categoria: 'Carnes y Aves', marca: 'Pronaca', unidad: 'kg', peso_neto: '~1kg', codigo_barras: '7750244009012' },
  { nombre: 'Lenteja Aliada 500g', categoria: 'Granos y Cereales', marca: 'Aliada', unidad: 'g', peso_neto: '500g', codigo_barras: '7750244010123' },
  { nombre: 'Tomate de Riñón 1Kg', categoria: 'Frutas y Verduras', marca: 'Granel', unidad: 'kg', peso_neto: '~1kg', codigo_barras: null },
  { nombre: 'Cebolla Paiteña 1Kg', categoria: 'Frutas y Verduras', marca: 'Granel', unidad: 'kg', peso_neto: '~1kg', codigo_barras: null },
  { nombre: 'Detergente Ariel 900g', categoria: 'Limpieza del Hogar', marca: 'Ariel', unidad: 'g', peso_neto: '900g', codigo_barras: '8001841083123' },
  { nombre: 'Mantequilla Klar 200g', categoria: 'Lácteos', marca: 'Klar', unidad: 'g', peso_neto: '200g', codigo_barras: '7750244011234' }
];

// Precios realistas por supermercado (con variaciones)
const PRECIOS_BASE = {
  'Leche Entera La Lechera 1L': { supermaxi: 1.25, megamaxi: 1.25, aki: 1.19, tia: 1.15 },
  'Arroz Superior Gustadina 5Kg': { supermaxi: 5.49, megamaxi: 5.49, aki: 5.20, tia: 5.10 },
  'Aceite La Favorita 1L': { supermaxi: 3.85, megamaxi: 3.85, aki: 3.79, tia: 3.72 },
  'Azúcar Valdez 2Kg': { supermaxi: 1.98, megamaxi: 1.98, aki: 1.95, tia: 1.89 },
  'Pan de Molde Bimbo 500g': { supermaxi: 1.75, megamaxi: 1.75, aki: 1.70, tia: 1.65 },
  'Huevos Pronaca 12 unidades': { supermaxi: 2.85, megamaxi: 2.85, aki: 2.75, tia: 2.65 },
  'Atún en Agua Real 180g': { supermaxi: 1.10, megamaxi: 1.10, aki: 0.99, tia: 0.87 },
  'Jabón Bonux 900g': { supermaxi: 3.95, megamaxi: 3.89, aki: 3.75, tia: 3.65 },
  'Shampoo Head & Shoulders 400ml': { supermaxi: 6.89, megamaxi: 6.75, aki: 6.59, tia: 6.45 },
  'Coca-Cola 2L': { supermaxi: 1.85, megamaxi: 1.85, aki: 1.79, tia: 1.75 },
  'Pasta Corona 400g': { supermaxi: 0.89, megamaxi: 0.89, aki: 0.85, tia: 0.79 },
  'Sal Cris-Sal 1Kg': { supermaxi: 0.45, megamaxi: 0.45, aki: 0.42, tia: 0.39 },
  'Papel Higiénico Scott x4 rollos': { supermaxi: 2.95, megamaxi: 2.89, aki: 2.75, tia: 2.65 },
  'Yogur Toni Natural 180g': { supermaxi: 0.65, megamaxi: 0.65, aki: 0.59, tia: 0.55 },
  'Pollo Entero Pronaca 1Kg': { supermaxi: 3.55, megamaxi: 3.55, aki: 3.45, tia: 3.35 },
  'Lenteja Aliada 500g': { supermaxi: 1.05, megamaxi: 1.05, aki: 0.99, tia: 0.89 },
  'Tomate de Riñón 1Kg': { supermaxi: 0.89, megamaxi: 0.89, aki: 0.85, tia: 0.79 },
  'Cebolla Paiteña 1Kg': { supermaxi: 0.75, megamaxi: 0.75, aki: 0.70, tia: 0.65 },
  'Detergente Ariel 900g': { supermaxi: 6.25, megamaxi: 6.15, aki: 5.99, tia: 5.85 },
  'Mantequilla Klar 200g': { supermaxi: 2.45, megamaxi: 2.45, aki: 2.35, tia: 2.25 }
};

// Descuentos simulados (algunos productos están en oferta)
const DESCUENTOS_MOCK = {
  'Atún en Agua Real 180g': { tia: 0.99, previo_tia: 1.15 },
  'Detergente Ariel 900g': { supermaxi: 5.99, previo_supermaxi: 6.25 },
  'Shampoo Head & Shoulders 400ml': { aki: 5.99, previo_aki: 6.59 },
  'Coca-Cola 2L': { megamaxi: 1.65, previo_megamaxi: 1.85 }
};

async function seed() {
  try {
    logger.info('🌱 Iniciando seed de datos mock...');

    // Usuario de demo
    const passwordHash = await bcrypt.hash('demo123', 10);
    await query(`
      INSERT INTO users (email, password_hash, nombre, puntos, nivel)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['demo@ahorraya.ec', passwordHash, 'Usuario Demo', 150, 'ahorrador']);

    // Insertar productos
    const productoIds = {};
    for (const prod of PRODUCTOS_MOCK) {
      const res = await query(`
        INSERT INTO productos (nombre, nombre_normalizado, categoria, marca, unidad, peso_neto, codigo_barras)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        prod.nombre,
        prod.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        prod.categoria,
        prod.marca,
        prod.unidad,
        prod.peso_neto,
        prod.codigo_barras
      ]);

      if (res.rows.length > 0) {
        productoIds[prod.nombre] = res.rows[0].id;
      } else {
        const existing = await query('SELECT id FROM productos WHERE nombre = $1', [prod.nombre]);
        if (existing.rows.length > 0) productoIds[prod.nombre] = existing.rows[0].id;
      }
    }

    // Insertar precios por supermercado
    const supermercados = ['supermaxi', 'megamaxi', 'aki', 'tia'];
    for (const [nombreProducto, precios] of Object.entries(PRECIOS_BASE)) {
      const prodId = productoIds[nombreProducto];
      if (!prodId) continue;

      for (const supermercado of supermercados) {
        const precio = precios[supermercado];
        if (!precio) continue;

        const descuento = DESCUENTOS_MOCK[nombreProducto];
        const precioOferta = descuento?.[supermercado];
        const precioAnterior = descuento?.[`previo_${supermercado}`];

        const precioFinal = precioOferta || precio;
        const descuentoPct = precioAnterior
          ? Math.round(((precioAnterior - precioFinal) / precioAnterior) * 100)
          : null;

        await query(`
          INSERT INTO precios (producto_id, supermercado, precio, precio_anterior, descuento_porcentaje, fuente)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (producto_id, supermercado) DO UPDATE SET
            precio = EXCLUDED.precio,
            precio_anterior = EXCLUDED.precio_anterior,
            descuento_porcentaje = EXCLUDED.descuento_porcentaje,
            fecha = NOW()
        `, [prodId, supermercado, precioFinal, precioAnterior || null, descuentoPct, 'scraper']);

        // Historial de los últimos 30 días
        for (let i = 30; i >= 0; i -= 5) {
          const fechaHistorial = new Date();
          fechaHistorial.setDate(fechaHistorial.getDate() - i);
          const variacion = 1 + (Math.random() * 0.1 - 0.05); // ±5%
          const precioHistorial = Math.round(precio * variacion * 100) / 100;

          await query(`
            INSERT INTO historial_precios (producto_id, supermercado, precio, fecha)
            VALUES ($1, $2, $3, $4)
          `, [prodId, supermercado, precioHistorial, fechaHistorial]);
        }
      }
    }

    logger.info(`✅ Seed completado: ${PRODUCTOS_MOCK.length} productos, 4 supermercados`);
    logger.info('👤 Usuario demo: demo@ahorraya.ec / demo123');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error en seed:', err);
    process.exit(1);
  }
}

seed();
