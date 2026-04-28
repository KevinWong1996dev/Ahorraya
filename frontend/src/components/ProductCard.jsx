import { useNavigate } from 'react-router-dom';

const SUP_COLORS = { supermaxi: '#0057A8', megamaxi: '#E31837', aki: '#FF6B00', tia: '#E31837' };
const SUP_LABELS = { supermaxi: 'Mi Comisariato', megamaxi: 'Megamaxi', aki: 'Akí', tia: 'Tía' };

export default function ProductCard({ producto, onAddCart, compact = false }) {
  const navigate = useNavigate();
  const { id, nombre, categoria, marca, imagen_url, peso_neto, unidad, min_precio, max_precio, max_descuento, num_supermercados, precios } = producto;

  const precioMasBarato = precios?.[0];
  const ahorroPotencial = max_precio && min_precio ? (max_precio - min_precio).toFixed(2) : null;

  // Mostrar solo peso_neto (ya contiene la unidad: "200ml", "1kg", "500g")
  // Si solo hay unidad sin peso, mostrarla. No duplicar.
  // Show peso_neto only (already contains unit e.g. '200g', '1L'). Never concat with unidad.
  const subtitulo = peso_neto || null;

  return (
    <div
      onClick={() => navigate(`/producto/${id}`)}
      style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gris-200)', padding: compact ? '12px' : '16px',
        cursor: 'pointer', transition: 'transform var(--transition), box-shadow var(--transition)',
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {max_descuento > 0 && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--rojo)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 6 }}>
          -{Number(max_descuento).toFixed(1)}%
        </div>
      )}

      {/* Imagen */}
      <div style={{ height: compact ? 60 : 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, background: 'var(--gris-50)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
        {imagen_url
          ? <img src={imagen_url} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          : null}
        <div style={{ display: imagen_url ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: compact ? 32 : 42 }}>
          {getCategoryEmoji(categoria)}
        </div>
      </div>

      {/* Info */}
      <div style={{ marginBottom: 8, flex: 1 }}>
        {marca && <div style={{ fontSize: 11, color: 'var(--gris-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 1 }}>{marca}</div>}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris-800)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {nombre}
        </div>
        {/* Peso · Unidad */}
        {subtitulo && (
          <div style={{ fontSize: 11, color: 'var(--gris-400)', marginTop: 3, fontWeight: 500 }}>{subtitulo}</div>
        )}
      </div>

      {/* Precio */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--verde)', fontFamily: 'var(--font-display)' }}>
          ${Number(min_precio).toFixed(2)}
        </span>
        {max_precio > min_precio && (
          <span style={{ fontSize: 12, color: 'var(--gris-400)', textDecoration: 'line-through' }}>
            ${Number(max_precio).toFixed(2)}
          </span>
        )}
      </div>

      {precioMasBarato && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: SUP_COLORS[precioMasBarato.supermercado] || 'var(--gris-400)' }} />
          <span style={{ fontSize: 12, color: 'var(--gris-600)', fontWeight: 500 }}>{SUP_LABELS[precioMasBarato.supermercado]}</span>
          {num_supermercados > 1 && <span style={{ fontSize: 11, color: 'var(--gris-400)' }}>+{num_supermercados - 1} más</span>}
        </div>
      )}

      {ahorroPotencial > 0.05 && (
        <div style={{ fontSize: 11, color: 'var(--verde)', fontWeight: 600, marginBottom: 8 }}>
          💰 Ahorra hasta ${ahorroPotencial}
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); onAddCart(); }}
        style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'var(--verde-claro)', color: 'var(--verde)', fontSize: 13, fontWeight: 600, transition: 'background var(--transition)', marginTop: 'auto' }}
        onMouseEnter={e => e.currentTarget.style.background = '#bbf7d0'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--verde-claro)'}
      >
        + Agregar al carrito
      </button>
    </div>
  );
}

function getCategoryEmoji(categoria) {
  const map = { 'Lácteos':'🥛','Granos y Cereales':'🌾','Aceites y Condimentos':'🫙','Azúcares y Endulzantes':'🍬','Panadería':'🍞','Huevos y Lácteos':'🥚','Conservas':'🐟','Limpieza del Hogar':'🧹','Cuidado Personal':'🧴','Bebidas':'🥤','Pastas y Fideos':'🍝','Condimentos':'🧂','Higiene':'🧻','Carnes y Aves':'🍗','Frutas y Verduras':'🥦','Snacks':'🍿','Congelados':'🧊','Mascotas':'🐾','Bebés':'🍼','Farmacia':'💊','Electrodomésticos':'🔌' };
  return map[categoria] || '🛒';
}
