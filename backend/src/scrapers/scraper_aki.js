/**
 * SCRAPER AKÍ - aki.com.ec
 * Misma corporación que Supermaxi, posiblemente comparte endpoints
 */

const logger = require('../utils/logger');

async function getProducts() {
  const USE_MOCK = process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_DATA === 'true';
  if (USE_MOCK) {
    logger.info('📦 Akí: usando datos mock');
    return getMockProducts();
  }
  return getMockProducts();
}

function getMockProducts() {
  return [
    { nombre: 'Leche Entera La Lechera 1L', precio: 1.19, categoria: 'Lácteos', marca: 'Nestlé' },
    { nombre: 'Arroz Superior Gustadina 5Kg', precio: 5.20, categoria: 'Granos y Cereales', marca: 'Gustadina' },
    { nombre: 'Aceite La Favorita 1L', precio: 3.79, categoria: 'Aceites', marca: 'La Favorita' },
    { nombre: 'Azúcar Valdez 2Kg', precio: 1.95, categoria: 'Azúcares', marca: 'Valdez' },
    { nombre: 'Pan de Molde Bimbo 500g', precio: 1.70, categoria: 'Panadería', marca: 'Bimbo' },
    { nombre: 'Huevos Pronaca 12u', precio: 2.75, categoria: 'Huevos', marca: 'Pronaca' },
    { nombre: 'Atún en Agua Real 180g', precio: 0.99, categoria: 'Conservas', marca: 'Real' },
    { nombre: 'Jabón Bonux 900g', precio: 3.75, categoria: 'Limpieza', marca: 'Bonux' },
    { nombre: 'Shampoo Head & Shoulders 400ml', precio: 5.99, precio_anterior: 6.59, descuento_porcentaje: 9, categoria: 'Cuidado Personal', marca: 'P&G' },
    { nombre: 'Coca-Cola 2L', precio: 1.79, categoria: 'Bebidas', marca: 'Coca-Cola' },
    { nombre: 'Pasta Corona 400g', precio: 0.85, categoria: 'Pastas', marca: 'Corona' },
    { nombre: 'Detergente Ariel 900g', precio: 5.99, categoria: 'Limpieza', marca: 'Ariel' },
    { nombre: 'Pollo Entero Pronaca ~1Kg', precio: 3.45, categoria: 'Carnes y Aves', marca: 'Pronaca' },
    { nombre: 'Lenteja Aliada 500g', precio: 0.99, categoria: 'Granos y Cereales', marca: 'Aliada' },
    { nombre: 'Sal Cris-Sal 1Kg', precio: 0.42, categoria: 'Condimentos', marca: 'Cris-Sal' }
  ];
}

module.exports = { getProducts };
