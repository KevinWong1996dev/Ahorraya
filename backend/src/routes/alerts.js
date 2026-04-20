// routes/alerts.js
const express = require('express');
const router = express.Router();
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { producto_id, precio_objetivo, descuento_minimo = 15 } = req.body;
    const result = await query(`
      INSERT INTO alertas (usuario_id, producto_id, precio_objetivo, descuento_minimo)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (usuario_id, producto_id) DO UPDATE SET
        precio_objetivo = EXCLUDED.precio_objetivo,
        descuento_minimo = EXCLUDED.descuento_minimo,
        activa = true
      RETURNING *
    `, [req.userId, producto_id, precio_objetivo || null, descuento_minimo]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear alerta' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, p.nombre as producto_nombre,
        (SELECT MIN(pr.precio) FROM precios pr WHERE pr.producto_id = a.producto_id) as precio_actual
      FROM alertas a
      JOIN productos p ON p.id = a.producto_id
      WHERE a.usuario_id = $1 AND a.activa = true
      ORDER BY a.created_at DESC
    `, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await query(
      'UPDATE alertas SET activa = false WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ mensaje: 'Alerta eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar alerta' });
  }
});

module.exports = router;
