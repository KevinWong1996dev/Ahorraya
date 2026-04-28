const express = require('express');
const router = express.Router();
const { query } = require('../database/db');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { q, categoria, supermercado, precio_min, precio_max, solo_ofertas, page = 1, limit = 20, orden = 'precio_asc' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let params = [];
    let conditions = [];
    let paramCount = 1;

    // Búsqueda: ILIKE para búsqueda parcial (más confiable que full-text para el usuario)
    if (q) {
      conditions.push(`(p.nombre ILIKE $${paramCount} OR p.marca ILIKE $${paramCount} OR p.categoria ILIKE $${paramCount})`);
      params.push(`%${q}%`);
      paramCount++;
    }
    if (categoria) { conditions.push(`p.categoria = $${paramCount}`); params.push(categoria); paramCount++; }
    if (supermercado) { conditions.push(`pr.supermercado = $${paramCount}`); params.push(supermercado); paramCount++; }
    if (precio_min) { conditions.push(`pr.precio >= $${paramCount}`); params.push(parseFloat(precio_min)); paramCount++; }
    if (precio_max) { conditions.push(`pr.precio <= $${paramCount}`); params.push(parseFloat(precio_max)); paramCount++; }
    if (solo_ofertas === 'true') { conditions.push(`pr.descuento_porcentaje IS NOT NULL AND pr.descuento_porcentaje > 0`); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const ordenMap = {
      precio_asc: 'min_precio ASC',
      precio_desc: 'min_precio DESC',
      descuento_desc: 'max_descuento DESC NULLS LAST',
      nombre_asc: 'p.nombre ASC'
    };
    const orderBy = ordenMap[orden] || 'min_precio ASC';

    const sqlQuery = `
      SELECT
        p.id, p.nombre, p.categoria, p.marca, p.imagen_url,
        p.unidad, p.peso_neto, p.codigo_barras,
        MIN(pr.precio) as min_precio,
        MAX(pr.precio) as max_precio,
        MAX(pr.descuento_porcentaje) as max_descuento,
        COUNT(DISTINCT pr.supermercado) as num_supermercados,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'supermercado', pr.supermercado,
            'precio', pr.precio,
            'precio_anterior', pr.precio_anterior,
            'descuento_porcentaje', pr.descuento_porcentaje,
            'fecha', pr.fecha,
            'disponible', pr.disponible
          ) ORDER BY pr.precio ASC
        ) as precios
      FROM productos p
      LEFT JOIN precios pr ON p.id = pr.producto_id AND pr.disponible = true
      ${whereClause}
      GROUP BY p.id, p.nombre, p.categoria, p.marca, p.imagen_url, p.unidad, p.peso_neto, p.codigo_barras
      HAVING COUNT(pr.id) > 0
      ORDER BY ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limitNum, offset);

    const result = await query(sqlQuery, params);

    // Count
    const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT p.id FROM productos p
        LEFT JOIN precios pr ON p.id = pr.producto_id AND pr.disponible = true
        ${whereClause}
        GROUP BY p.id
        HAVING COUNT(pr.id) > 0
      ) sub
    `;
    const countResult = await query(countSql, params.slice(0, -2));

    res.json({
      data: result.rows,
      pagination: {
        page: pageNum, limit: limitNum,
        total: parseInt(countResult.rows[0]?.total || 0),
        pages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / limitNum)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await query(`
      SELECT p.*,
        JSON_AGG(JSON_BUILD_OBJECT(
          'supermercado', pr.supermercado, 'precio', pr.precio,
          'precio_anterior', pr.precio_anterior, 'descuento_porcentaje', pr.descuento_porcentaje,
          'fecha', pr.fecha, 'disponible', pr.disponible, 'url_producto', pr.url_producto
        ) ORDER BY pr.precio ASC) as precios
      FROM productos p
      LEFT JOIN precios pr ON p.id = pr.producto_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);
    if (producto.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    const historial = await query(`
      SELECT supermercado, precio, fecha FROM historial_precios
      WHERE producto_id = $1 AND fecha >= NOW() - INTERVAL '30 days'
      ORDER BY fecha ASC
    `, [id]);

    res.json({ ...producto.rows[0], historial: historial.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// GET /api/products/meta/categorias
router.get('/meta/categorias', async (req, res) => {
  try {
    const result = await query(`SELECT categoria, COUNT(*) as cantidad FROM productos WHERE categoria IS NOT NULL GROUP BY categoria ORDER BY cantidad DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// GET /api/products/search/autocomplete
router.get('/search/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const result = await query(`
      SELECT id, nombre, categoria, marca, unidad, peso_neto
      FROM productos WHERE nombre ILIKE $1 OR marca ILIKE $1 LIMIT 8
    `, [`%${q}%`]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en autocompletado' });
  }
});

module.exports = router;
