/**
 * SCRAPER SUPERMAXI - supermaxi.com
 * 
 * Plataforma: SPA (React/Angular) - Corporación Favorita
 * Estrategia: Playwright para interceptar requests XHR/fetch
 * 
 * ANÁLISIS TÉCNICO:
 * - El sitio usa JavaScript pesado (SPA)
 * - Los productos se cargan vía API interna (endpoints XHR)
 * - Necesita Playwright para renderizar el JS
 * - Posibles endpoints: /api/v1/products o similares (inspeccionar DevTools > Network)
 * 
 * INSTRUCCIÓN PARA PRODUCCIÓN:
 * 1. Instalar: npm install playwright
 * 2. npx playwright install chromium
 * 3. Inspeccionar Network tab en supermaxi.com para identificar API endpoint
 * 4. Implementar interceptor de requests en el método getProductsReal()
 * 
 * LEGAL: Solo datos públicamente visibles. Rate limiting estricto.
 */

const logger = require('../utils/logger');
const { delay } = require('../utils/scraper_utils');

/**
 * Scraping real con Playwright (PRODUCCIÓN)
 * Requiere: npm install playwright && npx playwright install chromium
 */
async function getProductsReal() {
  // const { chromium } = require('playwright');
  // const browser = await chromium.launch({ headless: true });
  // const context = await browser.newContext({
  //   userAgent: 'Mozilla/5.0 (compatible; AhorraYaBot/1.0; +https://ahorraya.ec/bot)'
  // });
  // const page = await context.newPage();
  // const interceptedData = [];
  //
  // // Interceptar requests XHR para capturar datos de la API interna
  // page.on('response', async (response) => {
  //   const url = response.url();
  //   if (url.includes('/api/') && url.includes('product')) {
  //     try {
  //       const data = await response.json();
  //       if (data.products || data.items) {
  //         interceptedData.push(...(data.products || data.items));
  //       }
  //     } catch (e) {}
  //   }
  // });
  //
  // await page.goto('https://www.supermaxi.com/categoria/supermercado', {
  //   waitUntil: 'networkidle',
  //   timeout: 30000
  // });
  //
  // // Scroll para activar lazy loading
  // await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  // await delay(2000);
  //
  // await browser.close();
  // return interceptedData.map(item => ({
  //   nombre: item.name || item.titulo,
  //   precio: item.price || item.precio,
  //   precio_anterior: item.originalPrice || item.precioAnterior,
  //   categoria: item.category || item.categoria,
  //   imagen_url: item.image || item.imagen,
  //   url_producto: `https://www.supermaxi.com/producto/${item.slug || item.id}`
  // }));
  throw new Error('Playwright no instalado. Usar datos mock.');
}

async function getProducts() {
  const USE_MOCK = process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_DATA === 'true';

  if (USE_MOCK) {
    logger.info('📦 Supermaxi: usando datos mock');
    return getMockProducts();
  }

  try {
    return await getProductsReal();
  } catch (err) {
    logger.warn('Supermaxi real scraping falló, usando mock:', err.message);
    return getMockProducts();
  }
}

function getMockProducts() {
  return [
    { nombre: 'Leche Entera La Lechera 1L', precio: 1.25, categoria: 'Lácteos', marca: 'Nestlé' },
    { nombre: 'Arroz Superior Gustadina 5Kg', precio: 5.49, categoria: 'Granos y Cereales', marca: 'Gustadina' },
    { nombre: 'Aceite La Favorita 1L', precio: 3.85, categoria: 'Aceites', marca: 'La Favorita' },
    { nombre: 'Azúcar Valdez 2Kg', precio: 1.98, categoria: 'Azúcares', marca: 'Valdez' },
    { nombre: 'Pan de Molde Bimbo 500g', precio: 1.75, categoria: 'Panadería', marca: 'Bimbo' },
    { nombre: 'Huevos Pronaca 12u', precio: 2.85, categoria: 'Huevos', marca: 'Pronaca' },
    { nombre: 'Atún en Agua Real 180g', precio: 1.10, categoria: 'Conservas', marca: 'Real' },
    { nombre: 'Jabón Bonux 900g', precio: 3.95, categoria: 'Limpieza', marca: 'Bonux' },
    { nombre: 'Shampoo Head & Shoulders 400ml', precio: 6.89, categoria: 'Cuidado Personal', marca: 'P&G' },
    { nombre: 'Coca-Cola 2L', precio: 1.85, categoria: 'Bebidas', marca: 'Coca-Cola' },
    { nombre: 'Pasta Corona 400g', precio: 0.89, categoria: 'Pastas', marca: 'Corona' },
    { nombre: 'Detergente Ariel 900g', precio: 5.99, precio_anterior: 6.25, descuento_porcentaje: 4, categoria: 'Limpieza', marca: 'Ariel' },
    { nombre: 'Pollo Entero Pronaca ~1Kg', precio: 3.55, categoria: 'Carnes y Aves', marca: 'Pronaca' },
    { nombre: 'Yogur Toni Natural 180g', precio: 0.65, categoria: 'Lácteos', marca: 'Toni' },
    { nombre: 'Mantequilla Klar 200g', precio: 2.45, categoria: 'Lácteos', marca: 'Klar' }
  ];
}

module.exports = { getProducts };
