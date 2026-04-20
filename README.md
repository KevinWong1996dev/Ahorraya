# AhorraYa Ecuador 🛒💚
### Comparador Inteligente de Precios de Supermercados

---

## 📋 Análisis de Fuentes de Datos

### Estrategia por Supermercado

| Supermercado | Plataforma Web | Estrategia Recomendada |
|---|---|---|
| **Supermaxi/Megamaxi** | SPA (React/Angular), pertenece a Corporación Favorita | Playwright + interceptar requests XHR/fetch, posibles endpoints internos de catálogo |
| **Akí** | Sitio estático + JS, misma corporación que Supermaxi | HTML scraping + posibles endpoints compartidos con Supermaxi |
| **Tía** | Magento (tia.com.ec/supermercado), estructura clara de categorías | HTML scraping de Magento — URLs predecibles, paginación estándar |

### Endpoints identificados
- **Tía**: `tia.com.ec/supermercado?p=N` (2926+ productos, paginación Magento)
- **Supermaxi/Akí**: SPA con requests dinámicos — requiere inspección de Network tab
- **MVP**: Datos mock que replican estructura real + crowdsourcing

---

## 🏗️ Arquitectura del Sistema

```
ahorraya/
├── frontend/          # React + Vite PWA
├── backend/           # Node.js + Express API
│   ├── scrapers/      # Módulos por supermercado
│   ├── routes/        # API endpoints
│   ├── models/        # Modelos de datos
│   └── services/      # Lógica de negocio
├── database/          # PostgreSQL schemas
└── docs/              # Documentación
```

---

## 🚀 Instalación Rápida

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
npm run db:migrate
npm run db:seed       # Carga datos mock
npm run dev           # Puerto 3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev           # Puerto 5173
```

---

## 🌐 Deploy

### Frontend → Netlify
```bash
cd frontend
npm run build
# Subir carpeta dist/ a Netlify
# O: netlify deploy --prod --dir=dist
```

### Backend → Render
1. Crear nuevo Web Service en render.com
2. Conectar repositorio GitHub
3. Build command: `npm install`
4. Start command: `npm start`
5. Agregar variables de entorno desde .env

### Base de Datos → Supabase (PostgreSQL gratuito)
1. Crear proyecto en supabase.com
2. Copiar connection string
3. Pegar en DATABASE_URL del backend

---

## 📊 Modelo de Datos

```sql
users (id, email, password_hash, nombre, puntos, nivel, created_at)
productos (id, nombre, categoria, codigo_barras, imagen_url)
precios (id, producto_id, supermercado, precio, precio_anterior, fecha, fuente)
contribuciones (id, usuario_id, producto_id, precio, supermercado, validado, votos)
alertas (id, usuario_id, producto_id, precio_objetivo, activa)
historial_precios (id, producto_id, supermercado, precio, fecha)
```

---

## 🔧 Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/ahorraya
JWT_SECRET=tu_secret_super_seguro
PORT=3001
SCRAPING_INTERVAL_HOURS=6
RATE_LIMIT_REQUESTS=100
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=AhorraYa
```

---

## 🗺️ Roadmap MVP → Producción

- [x] Datos mock de 4 supermercados
- [x] Búsqueda y filtros
- [x] Comparador de precios
- [x] Carrito inteligente
- [x] Sistema de autenticación
- [x] Crowdsourcing básico
- [ ] Scraper real de Tía (Magento)
- [ ] Scraper Supermaxi/Akí (Playwright)
- [ ] Notificaciones push
- [ ] IA predicción de precios
- [ ] App móvil (React Native)
