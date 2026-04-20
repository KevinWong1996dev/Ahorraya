/**
 * MÓDULO BASE DE SCRAPERS - AhorraYa Ecuador
 * 
 * Arquitectura modular: cada supermercado tiene su propio módulo.
 * Si un scraper falla, no afecta a los demás.
 * 
 * NOTA LEGAL: Solo se scrapean datos públicamente visibles.
 * Se respetan los robots.txt y se implementa rate limiting.
 */

const logger = require('../utils/logger');
const { query } = require('../database/db');

// Importar scrapers individuales
const scraperSupermaxi = require('./scraper_supermaxi');
const scraperAki = require('./scraper_aki');
const scraperTia = require('./scraper_tia');
const scraperMegamaxi = require('./scraper_megamaxi');

/**
 * Normaliza datos de producto al formato estándar de AhorraYa
 */
function normalizarProducto(data, supermercado) {
  return {
    nombre: (data.nombre || '').trim(),
    nombre_normalizado: (data.nombre || '').toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim(),
    categoria: data.categoria || 'Sin categoría',
    marca: data.marca || null,
    codigo_barras: data.codigo_barras || null,
    imagen_url: data.imagen_url || null,
    precio: parseFloat(data.precio) || 0,
    precio_anterior: data.precio_anterior ? parseFloat(data.precio_anterior) : null,
    descuento_porcentaje: data.descuento_porcentaje
      ? parseFloat(data.descuento_porcentaje)
      : (data.precio_anterior
        ? Math.round(((data.precio_anterior - data.precio) / data.precio_anterior) * 100)
        : null),
    url_producto: data.url_producto || null,
    supermercado
  };
}

/**
 * Guarda productos normalizados en la base de datos
 */
async function guardarProductos(productos, supermercado) {
  let guardados = 0;
  let errores = 0;

  for (const prod of productos) {
    try {
      // Upsert producto
      const prodResult = await query(`
        INSERT INTO productos (nombre, nombre_normalizado, categoria, marca, codigo_barras, imagen_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (codigo_barras) WHERE codigo_barras IS NOT NULL DO UPDATE SET
          nombre = EXCLUDED.nombre,
          categoria = EXCLUDED.categoria,
          imagen_url = COALESCE(EXCLUDED.imagen_url, productos.imagen_url),
          updated_at = NOW()
        RETURNING id
      `, [prod.nombre, prod.nombre_normalizado, prod.categoria, prod.marca, prod.codigo_barras, prod.imagen_url]);

      let productoId;
      if (prodResult.rows.length > 0) {
        productoId = prodResult.rows[0].id;
      } else {
        // Buscar por nombre si no hay código de barras
        const existing = await query(
          'SELECT id FROM productos WHERE nombre_normalizado = $1 LIMIT 1',
          [prod.nombre_normalizado]
        );
        if (existing.rows.length > 0) {
          productoId = existing.rows[0].id;
        } else {
          const newProd = await query(`
            INSERT INTO productos (nombre, nombre_normalizado, categoria, marca, imagen_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [prod.nombre, prod.nombre_normalizado, prod.categoria, prod.marca, prod.imagen_url]);
          productoId = newProd.rows[0].id;
        }
      }

      // Obtener precio anterior antes de actualizar
      const precioActual = await query(
        'SELECT precio FROM precios WHERE producto_id = $1 AND supermercado = $2',
        [productoId, supermercado]
      );

      // Guardar en historial si hay precio previo
      if (precioActual.rows.length > 0) {
        await query(`
          INSERT INTO historial_precios (producto_id, supermercado, precio)
          VALUES ($1, $2, $3)
        `, [productoId, supermercado, precioActual.rows[0].precio]);
      }

      // Upsert precio
      await query(`
        INSERT INTO precios (producto_id, supermercado, precio, precio_anterior, descuento_porcentaje, url_producto, disponible, fuente)
        VALUES ($1, $2, $3, $4, $5, $6, true, 'scraper')
        ON CONFLICT (producto_id, supermercado) DO UPDATE SET
          precio = EXCLUDED.precio,
          precio_anterior = EXCLUDED.precio_anterior,
          descuento_porcentaje = EXCLUDED.descuento_porcentaje,
          url_producto = COALESCE(EXCLUDED.url_producto, precios.url_producto),
          disponible = true,
          fecha = NOW()
      `, [productoId, supermercado, prod.precio, prod.precio_anterior, prod.descuento_porcentaje, prod.url_producto]);

      guardados++;
    } catch (err) {
      logger.error(`Error guardando producto "${prod.nombre}":`, err.message);
      errores++;
    }
  }

  return { guardados, errores };
}

/**
 * Ejecuta un scraper individual con manejo de errores
 */
async function ejecutarScraper(nombre, scraperFn, supermercado) {
  const inicio = Date.now();
  logger.info(`🔍 Iniciando scraper: ${nombre}`);

  try {
    const productos = await scraperFn();
    const normalizados = productos.map(p => normalizarProducto(p, supermercado));
    const resultado = await guardarProductos(normalizados, supermercado);
    const duracion = ((Date.now() - inicio) / 1000).toFixed(1);

    logger.info(`✅ ${nombre}: ${resultado.guardados} guardados, ${resultado.errores} errores (${duracion}s)`);
    return { success: true, ...resultado };
  } catch (err) {
    const duracion = ((Date.now() - inicio) / 1000).toFixed(1);
    logger.error(`❌ ${nombre} falló después de ${duracion}s: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Ejecuta todos los scrapers en paralelo (con límite de concurrencia)
 */
async function runAllScrapers() {
  logger.info('🚀 Iniciando ciclo de scraping completo...');

  const resultados = await Promise.allSettled([
    ejecutarScraper('Supermaxi', scraperSupermaxi.getProducts, 'supermaxi'),
    ejecutarScraper('Megamaxi', scraperMegamaxi.getProducts, 'megamaxi'),
    ejecutarScraper('Akí', scraperAki.getProducts, 'aki'),
    ejecutarScraper('Tía', scraperTia.getProducts, 'tia')
  ]);

  const resumen = resultados.map((r, i) => ({
    scraper: ['Supermaxi', 'Megamaxi', 'Akí', 'Tía'][i],
    ...(r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
  }));

  logger.info('📊 Resumen del ciclo:', JSON.stringify(resumen));
  return resumen;
}

module.exports = { runAllScrapers, normalizarProducto, guardarProductos };
