/**
 * SCRAPER MEGAMAXI - megamaxi.com / supermaxi.com
 * Hipermercado de Corporación Favorita, comparte plataforma con Supermaxi
 */

const logger = require('../utils/logger');

async function getProducts() {
  logger.info('📦 Megamaxi: usando datos mock');
  return getMockProducts();
}

function getMockProducts() {
  return [
    { nombre: 'Leche Entera La Lechera 1L', precio: 1.25, categoria: 'Lácteos', marca: 'Nestlé' },
    { nombre: 'Arroz Superior Gustadina 5Kg', precio: 5.49, categoria: 'Granos y Cereales', marca: 'Gustadina' },
    { nombre: 'Aceite La Favorita 1L', precio: 3.85, categoria: 'Aceites', marca: 'La Favorita' },
    { nombre: 'Coca-Cola 2L', precio: 1.65, precio_anterior: 1.85, descuento_porcentaje: 11, categoria: 'Bebidas', marca: 'Coca-Cola' },
    { nombre: 'Detergente Ariel 900g', precio: 6.15, categoria: 'Limpieza', marca: 'Ariel' },
    { nombre: 'Shampoo Head & Shoulders 400ml', precio: 6.75, categoria: 'Cuidado Personal', marca: 'P&G' },
    { nombre: 'Jabón Bonux 900g', precio: 3.89, categoria: 'Limpieza', marca: 'Bonux' },
    { nombre: 'Pan de Molde Bimbo 500g', precio: 1.75, categoria: 'Panadería', marca: 'Bimbo' },
    { nombre: 'Pollo Entero Pronaca ~1Kg', precio: 3.55, categoria: 'Carnes y Aves', marca: 'Pronaca' },
    { nombre: 'Huevos Pronaca 12u', precio: 2.85, categoria: 'Huevos', marca: 'Pronaca' },
    { nombre: 'Pasta Corona 400g', precio: 0.89, categoria: 'Pastas', marca: 'Corona' },
    { nombre: 'Mantequilla Klar 200g', precio: 2.45, categoria: 'Lácteos', marca: 'Klar' }
  ];
}

module.exports = { getProducts };
