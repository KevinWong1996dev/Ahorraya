require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const priceRoutes = require('./routes/prices');
const cartRoutes = require('./routes/cart');
const contributionRoutes = require('./routes/contributions');
const alertRoutes = require('./routes/alerts');
const supermercadoRoutes = require('./routes/supermercados');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 100,
  message: { error: 'Demasiadas solicitudes, intenta en 15 minutos' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/supermercados', supermercadoRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AhorraYa API corriendo en puerto ${PORT}`);
});

// Cron job para scraping (cada 6 horas)
const SCRAPING_HOURS = parseInt(process.env.SCRAPING_INTERVAL_HOURS) || 6;
cron.schedule(`0 */${SCRAPING_HOURS} * * *`, async () => {
  logger.info('⏰ Iniciando ciclo de scraping programado...');
  try {
    const { runAllScrapers } = require('./scrapers');
    await runAllScrapers();
    logger.info('✅ Ciclo de scraping completado');
  } catch (err) {
    logger.error('❌ Error en ciclo de scraping:', err.message);
  }
});

module.exports = app;
