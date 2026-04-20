const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// GET /api/products - Buscar productos con precios
router.get('/', async (req, res) => {
  try {
    const {
      q,
      categoria,
      supermercado,
      precio_min,
      precio_max,
      solo_ofertas,
      page = 1,
      limit = 20,
      orden = 'precio_asc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let params = [];
    let conditions = [];
    let paramCount = 1;

    // Búsqueda full text
    if (q) {
      conditions.push(`to_tsvector('spanish', p.nombre) @@ plainto_tsquery('spanish', $${paramCount})`);
      params.push(q);
      paramCount++;
    }

    // Filtro por categoría
    if (categoria) {
      conditions.push(`p.categoria = $${paramCount}`);
      params.push(categoria);
      paramCount++;
    }

    // Filtro por supermercado
    if (supermercado) {
      conditions.push(`pr.supermercado = $${paramCount}`);
      params.push(supermercado);
      paramCount++;
    }

    // Filtro por precio mínimo
    if (precio_min) {
      conditions.push(`pr.precio >= $${paramCount}`);
      params.push(parseFloat(precio_min));
      paramCount++;
    }

    // Filtro por precio máximo
    if (precio_max) {
      conditions.push(`pr.precio <= $${paramCount}`);
      params.push(parseFloat(precio_max));
      paramCount++;
    }

    // Solo ofertas
    if (solo_ofertas === 'true') {
      conditions.push(`pr.descuento_porcentaje IS NOT NULL AND pr.descuento_porcentaje > 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Ordenamiento
    const ordenMap = {
      precio_asc: 'min_precio ASC',
      precio_desc: 'min_precio DESC',
      descuento_desc: 'max_descuento DESC NULLS LAST',
      nombre_asc: 'p.nombre ASC'
    };
    const orderBy = ordenMap[orden] || 'min_precio ASC';

    const sqlQuery = `
      SELECT
        p.id,
        p.nombre,
        p.categoria,
        p.marca,
        p.imagen_url,
        p.unidad,
        p.peso_neto,
        p.codigo_barras,
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

    // Count total
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM productos p
      LEFT JOIN precios pr ON p.id = pr.producto_id AND pr.disponible = true
      ${whereClause}
      HAVING COUNT(pr.id) > 0
    `;
    // Remover los params de paginación para el count
    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) as total FROM (${sqlQuery.replace(`LIMIT $${paramCount} OFFSET $${paramCount + 1}`, '')}) sub`,
      countParams
    );

    res.json({
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.rows[0]?.total || result.rows.length),
        pages: Math.ceil(parseInt(countResult.rows[0]?.total || result.rows.length) / limitNum)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

// GET /api/products/:id - Detalle de producto con historial
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await query(`
      SELECT p.*,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'supermercado', pr.supermercado,
            'precio', pr.precio,
            'precio_anterior', pr.precio_anterior,
            'descuento_porcentaje', pr.descuento_porcentaje,
            'fecha', pr.fecha,
            'disponible', pr.disponible,
            'url_producto', pr.url_producto
          ) ORDER BY pr.precio ASC
        ) as precios
      FROM productos p
      LEFT JOIN precios pr ON p.id = pr.producto_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    if (producto.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Historial de precios (últimos 30 días)
    const historial = await query(`
      SELECT supermercado, precio, fecha
      FROM historial_precios
      WHERE producto_id = $1 AND fecha >= NOW() - INTERVAL '30 days'
      ORDER BY fecha ASC
    `, [id]);

    res.json({
      ...producto.rows[0],
      historial: historial.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// GET /api/products/categorias - Lista de categorías
router.get('/meta/categorias', async (req, res) => {
  try {
    const result = await query(`
      SELECT categoria, COUNT(*) as cantidad
      FROM productos
      WHERE categoria IS NOT NULL
      GROUP BY categoria
      ORDER BY cantidad DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/products/search/autocomplete
router.get('/search/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const result = await query(`
      SELECT id, nombre, categoria, marca
      FROM productos
      WHERE nombre ILIKE $1 OR marca ILIKE $1
      LIMIT 8
    `, [`%${q}%`]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en autocompletado' });
  }
});

module.exports = router;
