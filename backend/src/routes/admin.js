const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
const { authenticateToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

router.use(authenticateToken, requireAdmin);

async function logAction(adminId, accion, entidad, entidad_id, detalle) {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, accion, entidad, entidad_id, detalle) VALUES ($1,$2,$3,$4,$5)`,
      [adminId, accion, entidad, entidad_id, JSON.stringify(detalle)]
    );
  } catch (e) {}
}

// ─── STATS ────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [productos, users, contribuciones, ofertas, categorias] = await Promise.all([
      query('SELECT COUNT(*) FROM productos'),
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM contribuciones'),
      query('SELECT COUNT(*) FROM precios WHERE descuento_porcentaje > 0'),
      query('SELECT nombre FROM categorias ORDER BY nombre')
    ]);
    res.json({
      productos: parseInt(productos.rows[0].count),
      usuarios: parseInt(users.rows[0].count),
      contribuciones: parseInt(contribuciones.rows[0].count),
      ofertas_activas: parseInt(ofertas.rows[0].count),
      categorias: categorias.rows.map(r => r.nombre)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener stats' });
  }
});

// ─── CATEGORÍAS ───────────────────────────────────────────────────
router.get('/categorias', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categorias ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

router.post('/categorias', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const result = await query(
      `INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING RETURNING *`,
      [nombre.trim()]
    );
    if (result.rows.length === 0) return res.status(409).json({ error: 'Categoría ya existe' });
    await logAction(req.userId, 'CREATE_CATEGORIA', 'categoria', result.rows[0].id, { nombre });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

router.delete('/categorias/:id', async (req, res) => {
  try {
    await query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

// ─── PRODUCTOS ────────────────────────────────────────────────────
router.get('/productos', async (req, res) => {
  try {
    const { q, page = 1, limit = 15 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (q) { where = 'WHERE p.nombre ILIKE $1'; params.push(`%${q}%`); }
    const sql = `
      SELECT p.*,
        (SELECT COUNT(*) FROM precios WHERE producto_id = p.id) as num_precios,
        (SELECT MIN(precio) FROM precios WHERE producto_id = p.id) as precio_min
      FROM productos p ${where}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    const result = await query(sql, params);
    const countRes = await query(`SELECT COUNT(*) FROM productos p ${where}`, params.slice(0, -2));
    res.json({ data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.post('/productos', async (req, res) => {
  try {
    const { nombre, categoria, subcategoria, marca, codigo_barras, imagen_url, descripcion, unidad, peso_neto } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const nombre_normalizado = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
    const result = await query(
      `INSERT INTO productos (nombre, nombre_normalizado, categoria, subcategoria, marca, codigo_barras, imagen_url, descripcion, unidad, peso_neto)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [nombre, nombre_normalizado, categoria, subcategoria, marca, codigo_barras || null, imagen_url, descripcion, unidad, peso_neto]
    );
    await logAction(req.userId, 'CREATE', 'producto', result.rows[0].id, { nombre });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Error crear producto:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria, subcategoria, marca, codigo_barras, imagen_url, descripcion, unidad, peso_neto } = req.body;
    const nombre_normalizado = nombre?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
    const result = await query(
      `UPDATE productos SET nombre=$1, nombre_normalizado=$2, categoria=$3, subcategoria=$4,
       marca=$5, codigo_barras=$6, imagen_url=$7, descripcion=$8, unidad=$9, peso_neto=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [nombre, nombre_normalizado, categoria, subcategoria, marca, codigo_barras || null, imagen_url, descripcion, unidad, peso_neto, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    await logAction(req.userId, 'UPDATE', 'producto', id, { nombre });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error actualizar producto:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Borrar en orden para respetar foreign keys
    await query('DELETE FROM historial_precios WHERE producto_id = $1', [id]);
    await query('DELETE FROM contribuciones WHERE producto_id = $1', [id]);
    await query('DELETE FROM alertas WHERE producto_id = $1', [id]);
    await query('DELETE FROM precios WHERE producto_id = $1', [id]);
    await query('DELETE FROM productos WHERE id = $1', [id]);
    await logAction(req.userId, 'DELETE', 'producto', id, {});
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    logger.error('Error borrar producto:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PRECIOS ─────────────────────────────────────────────────────
router.get('/precios/:productoId', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM precios WHERE producto_id = $1 ORDER BY supermercado`,
      [req.params.productoId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener precios' });
  }
});

router.put('/precios', async (req, res) => {
  try {
    const { producto_id, supermercado, precio, precio_anterior, descuento_porcentaje } = req.body;
    if (!producto_id || !supermercado || precio === undefined || precio === null || precio === '') {
      return res.status(400).json({ error: 'producto_id, supermercado y precio son requeridos' });
    }
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({ error: `Precio inválido: "${precio}"` });
    }
    const precioAnt = precio_anterior !== undefined && precio_anterior !== '' ? parseFloat(precio_anterior) : null;
    const descPct = descuento_porcentaje !== undefined && descuento_porcentaje !== '' ? parseFloat(descuento_porcentaje) : null;

    const result = await query(
      `INSERT INTO precios (producto_id, supermercado, precio, precio_anterior, descuento_porcentaje, disponible, fuente)
       VALUES ($1,$2,$3,$4,$5,true,'admin')
       ON CONFLICT (producto_id, supermercado) DO UPDATE SET
         precio=EXCLUDED.precio, precio_anterior=EXCLUDED.precio_anterior,
         descuento_porcentaje=EXCLUDED.descuento_porcentaje, disponible=true,
         fecha=NOW(), fuente='admin'
       RETURNING *`,
      [producto_id, supermercado, precioNum, precioAnt, descPct]
    );
    await logAction(req.userId, 'UPDATE_PRECIO', 'precio', producto_id, { supermercado, precio: precioNum });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error precio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/precios/:productoId/:supermercado', async (req, res) => {
  try {
    await query('DELETE FROM precios WHERE producto_id=$1 AND supermercado=$2', [req.params.productoId, req.params.supermercado]);
    res.json({ mensaje: 'Precio eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar precio' });
  }
});

// ─── USUARIOS ────────────────────────────────────────────────────
router.get('/usuarios', async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = '';
    if (q) { where = 'WHERE nombre ILIKE $1 OR email ILIKE $1'; params.push(`%${q}%`); }
    const sql = `SELECT id, email, nombre, puntos, nivel, role, created_at,
      (SELECT COUNT(*) FROM contribuciones WHERE usuario_id = u.id) as contribuciones
      FROM users u ${where}
      ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    const result = await query(sql, params);
    const countRes = await query(`SELECT COUNT(*) FROM users ${where}`, params.slice(0, -2));
    res.json({ data: result.rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.post('/usuarios', requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, nombre, role = 'admin' } = req.body;
    if (!email || !password || !nombre) return res.status(400).json({ error: 'Email, password y nombre requeridos' });
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email ya registrado' });
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, nombre, role, puntos, nivel) VALUES ($1,$2,$3,$4,0,'maestro') RETURNING id, email, nombre, role, created_at`,
      [email, hash, nombre, role]
    );
    await logAction(req.userId, 'CREATE_USER', 'user', result.rows[0].id, { email, role });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/usuarios/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, role, password } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, id]);
    }
    const result = await query(
      `UPDATE users SET nombre=$1, email=$2, role=$3, updated_at=NOW() WHERE id=$4 RETURNING id, email, nombre, role`,
      [nombre, email, role, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    await logAction(req.userId, 'UPDATE_USER', 'user', id, { role });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/usuarios/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.userId) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    await query('DELETE FROM users WHERE id = $1', [id]);
    await logAction(req.userId, 'DELETE_USER', 'user', id, {});
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// ─── CONTRIBUCIONES ──────────────────────────────────────────────
router.get('/contribuciones', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, p.nombre as producto_nombre, u.nombre as usuario_nombre
       FROM contribuciones c
       JOIN productos p ON p.id = c.producto_id
       LEFT JOIN users u ON u.id = c.usuario_id
       ORDER BY c.created_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener contribuciones' });
  }
});

router.delete('/contribuciones/:id', async (req, res) => {
  try {
    await query('DELETE FROM contribuciones WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Contribución eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar contribución' });
  }
});

// ─── LOGS ────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const result = await query(
      `SELECT l.*, u.nombre as admin_nombre FROM admin_logs l
       LEFT JOIN users u ON u.id = l.admin_id
       ORDER BY l.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener logs' });
  }
});

module.exports = router;
