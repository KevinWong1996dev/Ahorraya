import { useNavigate } from 'react-router-dom';

const SUP_COLORS = { supermaxi: '#E31837', megamaxi: '#E31837', aki: '#FF6B00', tia: '#00529B' };
const SUP_LABELS = { supermaxi: 'Supermaxi', megamaxi: 'Megamaxi', aki: 'Akí', tia: 'Tía' };

export default function ProductCard({ producto, onAddCart, compact = false }) {
  const navigate = useNavigate();
  const { id, nombre, categoria, marca, min_precio, max_precio, max_descuento, num_supermercados, precios } = producto;

  const precioMasBarato = precios?.[0];
  const ahorroPotencial = max_precio && min_precio ? (max_precio - min_precio).toFixed(2) : null;

  return (
    <div
      onClick={() => navigate(`/producto/${id}`)}
      style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gris-200)',
        padding: compact ? '12px' : '16px',
        cursor: 'pointer',
        transition: 'transform var(--transition), box-shadow var(--transition)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Badge descuento */}
      {max_descuento > 0 && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'var(--rojo)', color: '#fff',
          fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 6
        }}>-{Math.round(max_descuento)}%</div>
      )}

      {/* Emoji placeholder (sin imágenes protegidas) */}
      <div style={{
        height: compact ? 60 : 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: compact ? 32 : 42, marginBottom: 10,
        background: 'var(--gris-50)', borderRadius: 'var(--radius-md)'
      }}>
        {getCategoryEmoji(categoria)}
      </div>

      {/* Info producto */}
      <div style={{ marginBottom: 10 }}>
        {marca && <div style={{ fontSize: 11, color: 'var(--gris-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{marca}</div>}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris-800)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {nombre}
        </div>
      </div>

      {/* Precio */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--verde)', fontFamily: 'var(--font-display)' }}>
          ${Number(min_precio).toFixed(2)}
        </span>
        {max_precio > min_precio && (
          <span style={{ fontSize: 12, color: 'var(--gris-400)', textDecoration: 'line-through' }}>
            ${Number(max_precio).toFixed(2)}
          </span>
        )}
      </div>

      {/* Dónde más barato */}
      {precioMasBarato && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: SUP_COLORS[precioMasBarato.supermercado] || 'var(--gris-400)'
          }} />
          <span style={{ fontSize: 12, color: 'var(--gris-600)', fontWeight: 500 }}>
            {SUP_LABELS[precioMasBarato.supermercado]}
          </span>
          {num_supermercados > 1 && (
            <span style={{ fontSize: 11, color: 'var(--gris-400)' }}>+{num_supermercados - 1} más</span>
          )}
        </div>
      )}

      {/* Ahorro potencial */}
      {ahorroPotencial > 0.05 && (
        <div style={{ fontSize: 11, color: 'var(--verde)', fontWeight: 600, marginBottom: 8 }}>
          💰 Ahorra hasta ${ahorroPotencial}
        </div>
      )}

      {/* Botón agregar carrito */}
      <button
        onClick={e => { e.stopPropagation(); onAddCart(); }}
        style={{
          width: '100%', padding: '8px', borderRadius: 8,
          background: 'var(--verde-claro)', color: 'var(--verde)',
          fontSize: 13, fontWeight: 600,
          transition: 'background var(--transition)'
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#bbf7d0'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--verde-claro)'}
      >
        + Agregar al carrito
      </button>
    </div>
  );
}

function getCategoryEmoji(categoria) {
  const map = {
    'Lácteos': '🥛', 'Granos y Cereales': '🌾', 'Aceites': '🫙', 'Aceites y Condimentos': '🫙',
    'Azúcares': '🍬', 'Azúcares y Endulzantes': '🍬', 'Panadería': '🍞',
    'Huevos': '🥚', 'Huevos y Lácteos': '🥚', 'Conservas': '🐟', 'Limpieza': '🧹',
    'Limpieza del Hogar': '🧹', 'Cuidado Personal': '🧴', 'Bebidas': '🥤',
    'Pastas': '🍝', 'Pastas y Fideos': '🍝', 'Condimentos': '🧂',
    'Higiene': '🧻', 'Carnes y Aves': '🍗', 'Frutas y Verduras': '🥦', 'Snacks': '🍿'
  };
  return map[categoria] || '🛒';
}
