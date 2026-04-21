// require('dotenv').config({ path: '../../.env' });
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query } = require('./db');
const logger = require('../utils/logger');

const SCHEMA = `
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100),
  puntos INTEGER DEFAULT 0,
  nivel VARCHAR(20) DEFAULT 'novato' CHECK (nivel IN ('novato', 'ahorrador', 'experto', 'maestro')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos (catálogo abstracto)
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  nombre_normalizado VARCHAR(255),
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  codigo_barras VARCHAR(50),
  imagen_url TEXT,
  descripcion TEXT,
  unidad VARCHAR(50),
  peso_neto VARCHAR(50),
  marca VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de productos
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo_barras);

-- Tabla de precios (por supermercado)
CREATE TABLE IF NOT EXISTS precios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  supermercado VARCHAR(50) NOT NULL CHECK (supermercado IN ('supermaxi', 'megamaxi', 'aki', 'tia', 'coral', 'santa_maria')),
  precio DECIMAL(10,2) NOT NULL,
  precio_anterior DECIMAL(10,2),
  descuento_porcentaje DECIMAL(5,2),
  url_producto TEXT,
  disponible BOOLEAN DEFAULT true,
  fuente VARCHAR(20) DEFAULT 'scraper' CHECK (fuente IN ('scraper', 'crowdsourcing', 'api_oficial')),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(producto_id, supermercado)
);

CREATE INDEX IF NOT EXISTS idx_precios_producto ON precios(producto_id);
CREATE INDEX IF NOT EXISTS idx_precios_supermercado ON precios(supermercado);

-- Historial de precios
CREATE TABLE IF NOT EXISTS historial_precios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  supermercado VARCHAR(50) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_producto ON historial_precios(producto_id, supermercado, fecha);

-- Contribuciones de usuarios
CREATE TABLE IF NOT EXISTS contribuciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  precio DECIMAL(10,2) NOT NULL,
  supermercado VARCHAR(50) NOT NULL,
  foto_url TEXT,
  validado BOOLEAN DEFAULT false,
  votos_positivos INTEGER DEFAULT 0,
  votos_negativos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas de precios
CREATE TABLE IF NOT EXISTS alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  precio_objetivo DECIMAL(10,2),
  descuento_minimo INTEGER DEFAULT 15,
  activa BOOLEAN DEFAULT true,
  notificado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

-- Carritos guardados
CREATE TABLE IF NOT EXISTS carritos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nombre VARCHAR(100) DEFAULT 'Mi lista',
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function migrate() {
  try {
    logger.info('🔄 Ejecutando migraciones...');
    await query(SCHEMA);
    logger.info('✅ Migraciones completadas');
  } catch (err) {
    logger.error('❌ Error en migración:', err);
    process.exit(1);
  }
}

migrate();
