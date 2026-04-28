// routes/supermercados.js
const express = require('express');
const router = express.Router();

const SUPERMERCADOS_INFO = {
  supermaxi: { nombre: 'Mi Comisariato', color: '#0057A8', logo: '🏪', descripcion: 'Cadena de supermercados del Grupo El Rosado', sitio: 'https://www.micomisariato.com.ec' },
  megamaxi: { nombre: 'Mi Comisariato Plus', color: '#00407A', logo: '🏬', descripcion: 'Hipermercado del Grupo El Rosado', sitio: 'https://www.micomisariato.com.ec' },
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
