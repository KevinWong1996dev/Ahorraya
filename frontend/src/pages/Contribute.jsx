import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, contributionsAPI } from '../services/api';
import { useAuthStore } from '../store';

const SUPERMERCADOS = [
  { id: 'supermaxi', label: 'Supermaxi', color: '#E31837' },
  { id: 'megamaxi', label: 'Megamaxi', color: '#C01028' },
  { id: 'aki',      label: 'Akí',       color: '#FF6B00' },
  { id: 'tia',      label: 'Tía',       color: '#00529B' }
];

function getCatEmoji(c) {
  const m = { 'Lácteos':'🥛','Granos y Cereales':'🌾','Aceites':'🫙','Aceites y Condimentos':'🫙','Azúcares':'🍬','Panadería':'🍞','Huevos':'🥚','Huevos y Lácteos':'🥚','Conservas':'🐟','Limpieza del Hogar':'🧹','Cuidado Personal':'🧴','Bebidas':'🥤','Pastas y Fideos':'🍝','Condimentos':'🧂','Higiene':'🧻','Carnes y Aves':'🍗','Frutas y Verduras':'🥦','Snacks':'🍿' };
  return m[c] || '🛒';
}

export default function Contribute() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [step, setStep] = useState(1);
  const [searchQ, setSearchQ] = useState('');
  const [productos, setProductos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sup, setSup] = useState('');
  const [precio, setPrecio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  if (!token) return (
    <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>🔐</div>
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Inicia sesión para contribuir</h2>
      <p style={{ color: 'var(--gris-400)', marginBottom: 24, fontSize: 15 }}>Necesitas una cuenta para registrar precios y ganar puntos.</p>
      <button onClick={() => navigate('/login')} style={{ padding: '12px 28px', background: 'var(--verde)', color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700 }}>Iniciar sesión</button>
    </div>
  );

  const handleSearch = (val) => {
    setSearchQ(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setProductos([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await productsAPI.search({ q: val, limit: 8 });
      setProductos(res.data.data);
    }, 350);
  };

  const handleSubmit = async () => {
    if (!selected || !sup || !precio) return;
    setSubmitting(true); setError('');
    try {
      const res = await contributionsAPI.create({ producto_id: selected.id, precio: parseFloat(precio), supermercado: sup });
      setResultado(res.data); setStep(3);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al enviar. Verifica los datos.');
    } finally { setSubmitting(false); }
  };

  const reset = () => { setStep(1); setSearchQ(''); setProductos([]); setSelected(null); setSup(''); setPrecio(''); setResultado(null); setError(''); };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }} className="animate-fade">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>📝 Contribuir precio</h1>
        <p style={{ color: 'var(--gris-500)', fontSize: 15 }}>Reporta precios actuales y gana puntos. La comunidad lo agradece.</p>
      </div>

      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: '2rem' }}>
          {[{e:'⭐',t:'+10 pts',d:'Por cada precio'},{e:'✅',t:'+5 pts',d:'Si se valida'},{e:'🏆',t:'Ranking',d:'Top contribuidores'}].map(b => (
            <div key={b.t} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{b.e}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--verde)' }}>{b.t}</div>
              <div style={{ fontSize: 12, color: 'var(--gris-400)', marginTop: 2 }}>{b.d}</div>
            </div>
          ))}
        </div>
      )}

      {step < 3 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          {[1,2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= s ? 'var(--verde)' : 'var(--gris-100)', color: step >= s ? '#fff' : 'var(--gris-400)', fontSize: 13, fontWeight: 700 }}>{s}</div>
              <span style={{ fontSize: 13, color: step === s ? 'var(--gris-800)' : 'var(--gris-400)', fontWeight: step === s ? 600 : 400 }}>{s === 1 ? 'Seleccionar producto' : 'Registrar precio'}</span>
              {s < 2 && <span style={{ color: 'var(--gris-300)', fontSize: 18, marginLeft: 4 }}>›</span>}
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gris-200)', padding: '1.75rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: '1rem', color: 'var(--gris-700)' }}>¿Qué producto viste?</h2>
          <input value={searchQ} onChange={e => handleSearch(e.target.value)} placeholder="Busca por nombre o marca..." style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid var(--gris-200)', fontSize: 15, marginBottom: 8 }} />
          {productos.length > 0 && (
            <div style={{ border: '1px solid var(--gris-200)', borderRadius: 10, overflow: 'hidden' }}>
              {productos.map((p, i) => (
                <button key={p.id} onClick={() => { setSelected(p); setSearchQ(p.nombre); setProductos([]); setStep(2); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: i < productos.length - 1 ? '1px solid var(--gris-50)' : 'none' }}>
                  <span style={{ fontSize: 26 }}>{getCatEmoji(p.categoria)}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gris-800)' }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--gris-400)' }}>{p.categoria}{p.marca ? ` · ${p.marca}` : ''}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchQ.length >= 2 && productos.length === 0 && <div style={{ marginTop: 10, padding: '1rem', background: 'var(--gris-50)', borderRadius: 10, textAlign: 'center', color: 'var(--gris-400)', fontSize: 14 }}>Sin resultados. Solo se pueden contribuir precios de productos ya registrados.</div>}
        </div>
      )}

      {step === 2 && selected && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gris-200)', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--verde-claro)', borderRadius: 10, marginBottom: '1.5rem' }}>
            <span style={{ fontSize: 30 }}>{getCatEmoji(selected.categoria)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--verde)' }}>{selected.categoria}</div>
            </div>
            <button onClick={() => setStep(1)} style={{ color: 'var(--gris-400)', background: 'none', fontSize: 20 }}>×</button>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--gris-700)' }}>¿En qué supermercado?</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {SUPERMERCADOS.map(s => (
                <button key={s.id} onClick={() => setSup(s.id)} style={{ padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: sup === s.id ? `2px solid ${s.color}` : '1.5px solid var(--gris-200)', background: sup === s.id ? `${s.color}12` : '#fff', color: sup === s.id ? s.color : 'var(--gris-600)', transition: 'all 0.15s' }}>{s.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--gris-700)' }}>Precio que viste</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: 20, color: 'var(--gris-400)' }}>$</span>
              <input type="number" step="0.01" min="0.01" max="9999" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '13px 14px 13px 34px', borderRadius: 10, border: '2px solid var(--gris-200)', fontSize: 24, fontWeight: 700 }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--gris-400)', marginTop: 6 }}>Precio actual registrado: desde ${Number(selected.min_precio || 0).toFixed(2)}</div>
          </div>

          {error && <div style={{ background: 'var(--rojo-claro)', color: 'var(--rojo)', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: '1rem' }}>{error}</div>}

          <button onClick={handleSubmit} disabled={submitting || !sup || !precio} style={{ width: '100%', padding: '14px', borderRadius: 10, background: (!sup || !precio || submitting) ? 'var(--gris-200)' : 'var(--verde)', color: (!sup || !precio || submitting) ? 'var(--gris-400)' : '#fff', fontSize: 16, fontWeight: 700 }}>
            {submitting ? '⏳ Enviando...' : '✅ Registrar precio'}
          </button>
        </div>
      )}

      {step === 3 && resultado && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gris-200)', padding: '2.5rem', textAlign: 'center' }} className="animate-fade">
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>¡Gracias!</h2>
          <p style={{ color: 'var(--gris-500)', marginBottom: '2rem' }}>{resultado.mensaje}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: '2rem' }}>
            <div style={{ background: 'var(--verde-claro)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--verde)', fontFamily: 'var(--font-display)' }}>+{resultado.puntos_ganados}</div>
              <div style={{ fontSize: 13, color: 'var(--verde-hover)', fontWeight: 600 }}>Puntos ganados</div>
            </div>
            <div style={{ background: 'var(--azul-claro)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 2rem', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--azul)', fontFamily: 'var(--font-display)' }}>{resultado.puntos_totales}</div>
              <div style={{ fontSize: 13, color: '#0369a1', fontWeight: 600 }}>Puntos totales</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={reset} style={{ padding: '11px 24px', background: 'var(--verde)', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 700 }}>Otro precio</button>
            <button onClick={() => navigate('/perfil')} style={{ padding: '11px 24px', background: 'var(--gris-100)', color: 'var(--gris-700)', borderRadius: 10, fontSize: 15, fontWeight: 600 }}>Ver perfil</button>
          </div>
        </div>
      )}
    </div>
  );
}
