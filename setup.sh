#!/bin/bash
# ===========================================
# AhorraYa Ecuador - Script de instalación
# ===========================================
set -e
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🛒 AhorraYa Ecuador - Setup${NC}"
echo "================================"

# Backend
echo -e "\n${BLUE}📦 Instalando dependencias del backend...${NC}"
cd backend
cp .env.example .env 2>/dev/null || true
npm install

# Frontend
echo -e "\n${BLUE}🎨 Instalando dependencias del frontend...${NC}"
cd ../frontend
cp .env.example .env 2>/dev/null || true
npm install

echo -e "\n${GREEN}✅ Instalación completa!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "  1. Configura backend/.env con tu DATABASE_URL de PostgreSQL"
echo "  2. cd backend && npm run db:migrate && npm run db:seed"
echo "  3. cd backend && npm run dev     (puerto 3001)"
echo "  4. cd frontend && npm run dev    (puerto 5173)"
echo ""
echo "🌐 Abre: http://localhost:5173"
echo "👤 Demo: demo@ahorraya.ec / demo123"
