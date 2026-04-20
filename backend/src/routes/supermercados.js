// routes/supermercados.js
const express = require('express');
const router = express.Router();

const SUPERMERCADOS_INFO = {
  supermaxi: { nombre: 'Supermaxi', color: '#E31837', logo: '🏪', descripcion: 'Cadena premium de Corporación Favorita', sitio: 'https://www.supermaxi.com' },
  megamaxi: { nombre: 'Megamaxi', color: '#E31837', logo: '🏬', descripcion: 'Hipermercado de Corporación Favorita', sitio: 'https://www.supermaxi.com' },
  aki: { nombre: 'Akí', color: '#FF6B00', logo: '🛒', descripcion: 'Supermercados populares en todo Ecuador', sitio: 'https://www.aki.com.ec' },
  tia: { nombre: 'Tía', color: '#00529B', logo: '🛍️', descripcion: 'Supermercados de barrio con precios accesibles', sitio: 'https://www.tia.com.ec' }
};

router.get('/', (req, res) => {
  res.json(Object.entries(SUPERMERCADOS_INFO).map(([id, info]) => ({ id, ...info })));
});

router.get('/:id', (req, res) => {
  const info = SUPERMERCADOS_INFO[req.params.id];
  if (!info) return res.status(404).json({ error: 'Supermercado no encontrado' });
  res.json({ id: req.params.id, ...info });
});

module.exports = router;
