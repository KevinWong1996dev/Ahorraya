const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const PUNTOS_POR_CONTRIBUCION = 10;
const PUNTOS_POR_VALIDACION = 5;

const NIVELES = [
  { nombre: 'novato', minPuntos: 0 },
  { nombre: 'ahorrador', minPuntos: 50 },
  { nombre: 'experto', minPuntos: 200 },
  { nombre: 'maestro', minPuntos: 500 }
];

function calcularNivel(puntos) {
  let nivel = 'novato';
  for (const n of NIVELES) {
    if (puntos >= n.minPuntos) nivel = n.nombre;
  }
  return nivel;
}

// POST /api/contributions - Contribuir precio
router.post('/', authenticateToken, [
  body('producto_id').isUUID(),
  body('precio').isFloat({ min: 0.01 }),
  body('supermercado').isIn(['supermaxi', 'megamaxi', 'aki', 'tia', 'coral', 'santa_maria'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { producto_id, precio, supermercado, foto_url } = req.body;

    // Verificar que el producto existe
    const prod = await query('SELECT id, nombre FROM productos WHERE id = $1', [producto_id]);
    if (prod.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    // Detectar anomalía de precio (>50% diferente al precio actual)
    const precioActual = await query(
      'SELECT precio FROM precios WHERE producto_id = $1 AND supermercado = $2',
      [producto_id, supermercado]
    );
    if (precioActual.rows.length > 0) {
      const actual = parseFloat(precioActual.rows[0].precio);
      const diferencia = Math.abs(precio - actual) / actual;
      if (diferencia > 0.5) {
        return res.status(400).json({
          error: 'Precio sospechoso',
          mensaje: `El precio $${precio} difiere >50% del precio actual ($${actual}). Verifica y vuelve a intentar.`
        });
      }
    }

    const contrib = await query(`
      INSERT INTO contribuciones (usuario_id, producto_id, precio, supermercado, foto_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [req.userId, producto_id, precio, supermercado, foto_url || null]);

    // Sumar puntos al usuario
    const userUpdate = await query(`
      UPDATE users SET puntos = puntos + $1
      WHERE id = $2
      RETURNING puntos
    `, [PUNTOS_POR_CONTRIBUCION, req.userId]);

    const nuevosPuntos = userUpdate.rows[0].puntos;
    const nuevoNivel = calcularNivel(nuevosPuntos);

    // Actualizar nivel si cambió
    await query(
      'UPDATE users SET nivel = $1 WHERE id = $2 AND nivel != $1',
      [nuevoNivel, req.userId]
    );

    res.status(201).json({
      contribucion: contrib.rows[0],
      puntos_ganados: PUNTOS_POR_CONTRIBUCION,
      puntos_totales: nuevosPuntos,
      nivel: nuevoNivel,
      mensaje: `¡Gracias! Ganaste ${PUNTOS_POR_CONTRIBUCION} puntos por tu contribución.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar contribución' });
  }
});

// POST /api/contributions/:id/votar - Votar contribución
router.post('/:id/votar', authenticateToken, [
  body('voto').isIn(['positivo', 'negativo'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const { voto } = req.body;

    const campo = voto === 'positivo' ? 'votos_positivos' : 'votos_negativos';
    const contrib = await query(`
      UPDATE contribuciones SET ${campo} = ${campo} + 1
      WHERE id = $1
      RETURNING id, producto_id, supermercado, precio, votos_positivos, votos_negativos
    `, [id]);

    if (contrib.rows.length === 0) return res.status(404).json({ error: 'Contribución no encontrada' });

    const c = contrib.rows[0];

    // Auto-validar si tiene 3+ votos positivos y ratio > 70%
    const total = c.votos_positivos + c.votos_negativos;
    if (!c.validado && total >= 3 && (c.votos_positivos / total) >= 0.7) {
      await query(`
        UPDATE contribuciones SET validado = true WHERE id = $1
      `, [id]);

      // Actualizar precio en la tabla principal
      await query(`
        INSERT INTO precios (producto_id, supermercado, precio, fuente)
        VALUES ($1, $2, $3, 'crowdsourcing')
        ON CONFLICT (producto_id, supermercado) DO UPDATE SET
          precio = EXCLUDED.precio, fecha = NOW(), fuente = 'crowdsourcing'
      `, [c.producto_id, c.supermercado, c.precio]);

      // Bonus al contribuidor
      const contribUser = await query('SELECT usuario_id FROM contribuciones WHERE id = $1', [id]);
      if (contribUser.rows[0]?.usuario_id) {
        await query(
          'UPDATE users SET puntos = puntos + $1 WHERE id = $2',
          [PUNTOS_POR_VALIDACION, contribUser.rows[0].usuario_id]
        );
      }
    }

    res.json({ mensaje: 'Voto registrado', ...c });
  } catch (err) {
    res.status(500).json({ error: 'Error al votar' });
  }
});

// GET /api/contributions/ranking - Top contribuidores
router.get('/ranking', async (req, res) => {
  try {
    const result = await query(`
      SELECT nombre, puntos, nivel,
        (SELECT COUNT(*) FROM contribuciones WHERE usuario_id = u.id) as contribuciones
      FROM users u
      ORDER BY puntos DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

module.exports = router;
