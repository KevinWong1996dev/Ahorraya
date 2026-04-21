const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/db');
const { authenticateToken, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nombre').trim().isLength({ min: 2 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, password, nombre } = req.body;
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email ya registrado' });
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, nombre, role) VALUES ($1,$2,$3,'user') RETURNING id, email, nombre, puntos, nivel, role, created_at`,
      [email, hash, nombre]
    );
    const user = result.rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, password } = req.body;
    const result = await query(
      `SELECT id, email, nombre, password_hash, puntos, nivel, role, avatar_url FROM users WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const { password_hash, ...safe } = user;
    res.json({ user: safe, token: signToken(safe) });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, nombre, puntos, nivel, role, avatar_url, created_at,
        (SELECT COUNT(*) FROM contribuciones WHERE usuario_id = $1) as total_contribuciones
       FROM users WHERE id = $1`,
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

module.exports = router;
