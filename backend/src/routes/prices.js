const express = require('express');
const router = express.Router();
const { query } = require('../database/db');

// GET /api/prices/:productoId/history
router.get('/:productoId/history', async (req, res) => {
  try {
    const { productoId } = req.params;
    const { supermercado, dias = 30 } = req.query;

    let sql = `
      SELECT supermercado, precio, fecha
      FROM historial_precios
      WHERE producto_id = $1 AND fecha >= NOW() - INTERVAL '${parseInt(dias)} days'
    `;
    const params = [productoId];

    if (supermercado) {
      sql += ` AND supermercado = $2`;
      params.push(supermercado);
    }

    sql += ` ORDER BY fecha ASC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// GET /api/prices/ofertas - Mejores ofertas del momento
router.get('/destacadas/ofertas', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.id, p.nombre, p.categoria, p.marca,
        pr.supermercado, pr.precio, pr.precio_anterior, pr.descuento_porcentaje
      FROM precios pr
      JOIN productos p ON p.id = pr.producto_id
      WHERE pr.descuento_porcentaje IS NOT NULL AND pr.descuento_porcentaje >= 10
        AND pr.disponible = true
      ORDER BY pr.descuento_porcentaje DESC
      LIMIT 12
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ofertas' });
  }
});

module.exports = router;
