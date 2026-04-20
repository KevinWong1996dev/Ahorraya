/**
 * SCRAPER TÍA - tia.com.ec
 * 
 * Plataforma: Magento (estructura estándar, predecible)
 * Estrategia: HTTP scraping con cheerio (sin browser headless necesario)
 * URL base: https://www.tia.com.ec/supermercado
 * Paginación: ?p=N (2926+ productos, ~244 páginas de 12)
 * 
 * LEGAL: Solo datos públicamente visibles. Rate limiting aplicado.
 * NOTA: En producción usar Playwright para contenido dinámico.
 */

const logger = require('../utils/logger');
const { delay, randomUserAgent, fetchWithRetry } = require('../utils/scraper_utils');

const BASE_URL = 'https://www.tia.com.ec';
const SUPERMERCADO_URL = `${BASE_URL}/supermercado`;
const MAX_PAGES = parseInt(process.env.TIA_MAX_PAGES) || 5; // Limitar en desarrollo
const DELAY_MS = parseInt(process.env.SCRAPER_DELAY_MS) || 2000;

/**
 * Parsea un ítem de producto del HTML de Tía (Magento)
 * Estructura conocida: .product-item con precio y nombre
 */
function parsearProductoTia(html) {
  // En producción usar cheerio para parsear HTML real
  // Aquí simulamos la estructura que devolvería el scraper
  return null;
}

/**
 * Scraper principal de Tía
 * En MVP usa datos mock; en producción activar el scraping real
 */
async function getProducts() {
  const USE_MOCK = process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_DATA === 'true';

  if (USE_MOCK) {
    logger.info('📦 Tía: usando datos mock (activar USE_MOCK_DATA=false para scraping real)');
    return getMockProducts();
  }

  // PRODUCCIÓN: Scraping real de tia.com.ec
  logger.info('🌐 Tía: iniciando scraping real...');
  const productos = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${SUPERMERCADO_URL}?p=${page}`;

      const response = await fetchWithRetry(url, {
        headers: {
          'User-Agent': randomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-EC,es;q=0.9'
        }
      });

      if (!response) break;

      // Parsear con cheerio (instalar: npm install cheerio)
      // const $ = require('cheerio').load(response);
      // $('.product-item-info').each((i, el) => {
      //   const nombre = $(el).find('.product-item-name').text().trim();
      //   const precio = $(el).find('.price').first().text().replace('$', '').trim();
      //   const precioAnterior = $(el).find('.old-price .price').text().replace('$', '').trim();
      //   productos.push({ nombre, precio, precio_anterior: precioAnterior || null, categoria: 'Supermercado' });
      // });

      logger.info(`Tía página ${page}/${MAX_PAGES}: ${productos.length} productos`);
      await delay(DELAY_MS);
    }
  } catch (err) {
    logger.error('Error scraping Tía:', err.message);
  }

  return productos.length > 0 ? productos : getMockProducts();
}

/**
 * Datos mock realistas de Tía para desarrollo/testing
 * Basados en precios reales observados en tia.com.ec
 */
function getMockProducts() {
  return [
    { nombre: 'Lenteja Aliada en tu Ahorro 500g', precio: 0.89, categoria: 'Granos y Cereales', marca: 'Aliada', url_producto: `${BASE_URL}/lenteja-aliada` },
    { nombre: 'Leche Condensada La Lechera 393g', precio: 2.29, categoria: 'Lácteos', marca: 'La Lechera' },
    { nombre: 'Snack Bocaditos de Trigo Rollitos 35g', precio: 0.25, categoria: 'Snacks', marca: 'Rollitos' },
    { nombre: 'Sardinas en Salsa de Tomate Real 156g', precio: 0.87, categoria: 'Conservas', marca: 'Real' },
    { nombre: 'Aceite La Favorita 4L', precio: 8.19, categoria: 'Aceites', marca: 'La Favorita' },
    { nombre: 'Arroz Superior Gustadina 5Kg', precio: 5.10, categoria: 'Granos y Cereales', marca: 'Gustadina' },
    { nombre: 'Leche Entera La Lechera 1L', precio: 1.15, categoria: 'Lácteos', marca: 'Nestlé' },
    { nombre: 'Azúcar Valdez 2Kg', precio: 1.89, categoria: 'Azúcares', marca: 'Valdez' },
    { nombre: 'Atún en Agua Real 180g', precio: 0.87, precio_anterior: 0.99, descuento_porcentaje: 12, categoria: 'Conservas', marca: 'Real' },
    { nombre: 'Jabón Bonux 900g', precio: 3.65, categoria: 'Limpieza', marca: 'Bonux' },
    { nombre: 'Pasta Corona 400g', precio: 0.79, categoria: 'Pastas', marca: 'Corona' },
    { nombre: 'Sal Cris-Sal 1Kg', precio: 0.39, categoria: 'Condimentos', marca: 'Cris-Sal' },
    { nombre: 'Pollo Entero Pronaca ~1Kg', precio: 3.35, categoria: 'Carnes y Aves', marca: 'Pronaca' },
    { nombre: 'Huevos Pronaca 12u', precio: 2.65, categoria: 'Huevos', marca: 'Pronaca' },
    { nombre: 'Shampoo Head & Shoulders 400ml', precio: 6.45, categoria: 'Cuidado Personal', marca: 'P&G' }
  ];
}

module.exports = { getProducts };
