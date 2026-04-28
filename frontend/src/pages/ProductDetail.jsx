import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { productsAPI, pricesAPI, alertsAPI } from '../services/api';
import { useCartStore, useAuthStore } from '../store';

const SUP_COLORS = { tia: '#E31837', aki: '#FF6B00', megamaxi: '#E31837', supermaxi: '#0057A8' };
const SUP_LABELS = { tia: 'Tía', aki: 'Akí', megamaxi: 'Megamaxi', supermaxi: 'Mi Comisariato' };

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const { user } = useAuthStore();

  const [producto, setProducto] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [alertCreated, setAlertCreated] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    Promise.all([productsAPI.getById(id), pricesAPI.history(id)])
      .then(([prodRes, histRes]) => { setProducto(prodRes.data); setHistorial(histRes.data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'grid', gap: 16 }}>
      {[300, 200, 250].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  if (!producto) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <p>Producto no encontrado</p>
      <button onClick={() => navigate('/')} style={{ marginTop: 12, padding: '8px 20px', background: 'var(--verde)', color: '#fff', borderRadius: 8 }}>Volver</button>
    </div>
  );

  const precios = producto.precios?.filter(p => p.disponible !== false) || [];
  const masBarato = precios[0];
  const masCaro = precios[precios.length - 1];
  const ahorro = masBarato && masCaro ? (masCaro.precio - masBarato.precio).toFixed(2) : 0;
  const subtitulo = producto.peso_neto || null;

  const supEnHistorial = [...new Set(historial.map(h => h.supermercado))];
  const fechasUnicas = [...new Set(historial.map(h => new Date(h.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })))];
  const chartData = fechasUnicas.map(fecha => {
    const punto = { fecha };
    supEnHistorial.forEach(sup => {
      const e = historial.find(h => new Date(h.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) === fecha && h.supermercado === sup);
      if (e) punto[sup] = Number(e.precio);
    });
    return punto;
  });

  const handleAddAlert = async () => {
    if (!user) { navigate('/login'); return; }
    try { await alertsAPI.create({ producto_id: id, descuento_minimo: 15 }); setAlertCreated(true); } catch (e) {}
  };

  return (
    <div className="animate-fade">
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gris-400)', fontSize: 14, marginBottom: '1.5rem', background: 'none', padding: '4px 8px', borderRadius: 6 }}>← Volver</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Columna izquierda */}
        <div>
          {/* Imagen */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gris-200)', marginBottom: 12, overflow: 'hidden', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {producto.imagen_url && !imgError ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }}
              />
            ) : (
              <div style={{ fontSize: 80, textAlign: 'center' }}>{getCategoryEmoji(producto.categoria)}</div>
            )}
          </div>

          {/* Info */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--gris-200)' }}>
            <div style={{ fontSize: 11, color: 'var(--gris-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
              {producto.marca} · {producto.categoria}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gris-900)', marginBottom: 4 }}>{producto.nombre}</h1>
            {subtitulo && <div style={{ fontSize: 13, color: 'var(--gris-400)', marginBottom: 12, fontWeight: 500 }}>{subtitulo}</div>}
            {producto.descripcion && <div style={{ fontSize: 13, color: 'var(--gris-600)', marginBottom: 12, lineHeight: 1.5 }}>{producto.descripcion}</div>}
            {producto.codigo_barras && <div style={{ fontSize: 12, color: 'var(--gris-400)', marginBottom: 12 }}>Cód: {producto.codigo_barras}</div>}

            <button onClick={() => { addItem(producto); setAdded(true); setTimeout(() => setAdded(false), 2000); }}
              style={{ width: '100%', padding: '11px', borderRadius: 10, background: added ? 'var(--verde)' : 'var(--verde-claro)', color: added ? '#fff' : 'var(--verde)', fontSize: 15, fontWeight: 700, transition: 'all 0.2s', marginBottom: 8 }}>
              {added ? '✓ Agregado' : '+ Agregar al carrito'}
            </button>
            <button onClick={handleAddAlert} style={{ width: '100%', padding: '9px', borderRadius: 10, background: alertCreated ? '#fff7ed' : '#fff', color: alertCreated ? '#c2410c' : 'var(--gris-600)', fontSize: 13, fontWeight: 500, border: '1px solid var(--gris-200)' }}>
              {alertCreated ? '🔔 Alerta activada' : '🔔 Alertar cuando baje el precio'}
            </button>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ahorro > 0.05 && (
            <div style={{ background: 'linear-gradient(135deg, var(--verde-claro), #d1fae5)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 40 }}>💰</div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--verde-hover)', fontWeight: 600 }}>Ahorro potencial</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--verde)', fontFamily: 'var(--font-display)' }}>${ahorro}</div>
                <div style={{ fontSize: 13, color: 'var(--gris-600)' }}>entre {SUP_LABELS[masBarato?.supermercado]} y {SUP_LABELS[masCaro?.supermercado]}</div>
              </div>
            </div>
          )}

          {/* Tabla precios */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gris-100)', fontWeight: 700, fontSize: 15 }}>Comparar precios</div>
            {precios.map((p, i) => (
              <div key={p.supermercado} style={{ display: 'flex', alignItems: 'center', padding: '14px 1.25rem', borderBottom: i < precios.length - 1 ? '1px solid var(--gris-100)' : 'none', background: i === 0 ? '#f0fdf4' : '#fff', gap: 14 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: SUP_COLORS[p.supermercado], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{SUP_LABELS[p.supermercado]}</div>
                  {p.precio_anterior && <div style={{ fontSize: 12, color: 'var(--gris-400)' }}>Antes: ${Number(p.precio_anterior).toFixed(2)}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: i === 0 ? 'var(--verde)' : 'var(--gris-700)', fontFamily: 'var(--font-display)' }}>${Number(p.precio).toFixed(2)}</div>
                  {p.descuento_porcentaje > 0 && <span style={{ fontSize: 11, background: 'var(--rojo)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>-{Number(p.descuento_porcentaje).toFixed(1)}%</span>}
                </div>
                {i === 0 && <span className="badge-verde">Más barato</span>}
                {i > 0 && <span style={{ fontSize: 11, color: 'var(--gris-400)', minWidth: 60, textAlign: 'right' }}>+${(p.precio - masBarato.precio).toFixed(2)}</span>}
              </div>
            ))}
          </div>

          {/* Historial */}
          {chartData.length > 1 && (
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: '1rem' }}>Historial de precios (30 días)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gris-100)" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--gris-400)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--gris-400)' }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v, name) => [`$${Number(v).toFixed(2)}`, SUP_LABELS[name] || name]} />
                  <Legend formatter={name => SUP_LABELS[name] || name} />
                  {supEnHistorial.map(sup => (
                    <Line key={sup} type="monotone" dataKey={sup} stroke={SUP_COLORS[sup]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(c) {
  const m = { 'Lácteos':'🥛','Granos y Cereales':'🌾','Aceites y Condimentos':'🫙','Azúcares y Endulzantes':'🍬','Panadería':'🍞','Huevos y Lácteos':'🥚','Conservas':'🐟','Limpieza del Hogar':'🧹','Cuidado Personal':'🧴','Bebidas':'🥤','Pastas y Fideos':'🍝','Condimentos':'🧂','Higiene':'🧻','Carnes y Aves':'🍗','Frutas y Verduras':'🥦','Snacks':'🍿','Congelados':'🧊','Mascotas':'🐾','Bebés':'🍼','Farmacia':'💊','Electrodomésticos':'🔌' };
  return m[c] || '🛒';
}
