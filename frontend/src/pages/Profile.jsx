import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, contributionsAPI, alertsAPI } from '../services/api';
import { useAuthStore } from '../store';

const NIVELES = {
  novato:    { label: 'Novato',    emoji: '🌱', color: '#64748b', min: 0,   max: 50  },
  ahorrador: { label: 'Ahorrador', emoji: '💚', color: '#16a34a', min: 50,  max: 200 },
  experto:   { label: 'Experto',   emoji: '⭐', color: '#0ea5e9', min: 200, max: 500 },
  maestro:   { label: 'Maestro',   emoji: '👑', color: '#f59e0b', min: 500, max: 9999 }
};

export default function Profile() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const [perfil, setPerfil] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ranking');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    Promise.all([authAPI.me(), contributionsAPI.ranking(), alertsAPI.getAll()])
      .then(([me, rank, alert]) => { setPerfil(me.data); setRanking(rank.data); setAlertas(alert.data); })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (loading) return <div style={{ maxWidth: 640, margin: '2rem auto', display: 'grid', gap: 14 }}>{[200,150,180].map((h,i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-lg)' }} />)}</div>;
  if (!perfil) return null;

  const nivel = NIVELES[perfil.nivel] || NIVELES.novato;
  const progresoPct = nivel.max > nivel.min ? Math.min(100, ((perfil.puntos - nivel.min) / (nivel.max - nivel.min)) * 100) : 100;
  const faltanPts = nivel.max < 9999 ? nivel.max - perfil.puntos : null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }} className="animate-fade">
      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gris-200)', padding: '2rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: `${nivel.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: nivel.color, border: `2px solid ${nivel.color}30`, flexShrink: 0 }}>
            {perfil.nombre?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{perfil.nombre}</h1>
            <div style={{ fontSize: 13, color: 'var(--gris-400)', marginBottom: '0.75rem' }}>{perfil.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{nivel.emoji}</span>
              <span style={{ fontWeight: 700, color: nivel.color }}>{nivel.label}</span>
              <span style={{ color: 'var(--gris-300)' }}>·</span>
              <span style={{ fontWeight: 700, color: 'var(--gris-700)' }}>{perfil.puntos} pts</span>
            </div>
            <div style={{ height: 6, background: 'var(--gris-100)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', background: nivel.color, borderRadius: 99, width: `${progresoPct}%`, transition: 'width 1s' }} />
            </div>
            {faltanPts > 0 && <div style={{ fontSize: 11, color: 'var(--gris-400)' }}>Faltan {faltanPts} pts para el siguiente nivel</div>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--gris-100)' }}>
          {[
            { v: perfil.total_contribuciones || 0, l: 'Contribuciones', e: '📝' },
            { v: perfil.puntos, l: 'Puntos totales', e: '⭐' },
            { v: new Date(perfil.created_at).toLocaleDateString('es-EC', { month: 'short', year: 'numeric' }), l: 'Miembro desde', e: '📅' }
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.e}</div>
              <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--gris-800)' }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--gris-400)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', background: 'var(--gris-100)', borderRadius: 12, padding: 4 }}>
        {[{ id: 'ranking', label: '🏆 Ranking' }, { id: 'alertas', label: `🔔 Alertas (${alertas.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px', borderRadius: 9, fontSize: 14, fontWeight: 600, background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? 'var(--gris-800)' : 'var(--gris-400)', boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s' }}>{t.label}</button>
        ))}
      </div>

      {/* Ranking */}
      {tab === 'ranking' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gris-100)', fontWeight: 700, fontSize: 15 }}>Top contribuidores</div>
          {ranking.map((u, i) => {
            const n = NIVELES[u.nivel] || NIVELES.novato;
            const isMe = u.nombre === perfil.nombre;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 1.25rem', borderBottom: i < ranking.length - 1 ? '1px solid var(--gris-50)' : 'none', background: isMe ? 'var(--verde-claro)' : 'transparent' }}>
                <div style={{ width: 26, textAlign: 'center', fontWeight: 800, fontSize: i < 3 ? 18 : 13, color: 'var(--gris-400)' }}>{i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</div>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${n.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: n.color, flexShrink: 0 }}>{u.nombre?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.nombre}{isMe && <span style={{ fontSize: 11, color: 'var(--verde)', marginLeft: 6 }}>(tú)</span>}</div>
                  <div style={{ fontSize: 12, color: 'var(--gris-400)' }}>{n.emoji} {n.label} · {u.contribuciones} contribuciones</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--gris-700)' }}>{u.puntos} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--gris-400)' }}>pts</span></div>
              </div>
            );
          })}
          {ranking.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gris-400)', fontSize: 14 }}>Sin contribuidores aún. ¡Sé el primero!</div>}
        </div>
      )}

      {/* Alertas */}
      {tab === 'alertas' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)', overflow: 'hidden' }}>
          {alertas.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gris-400)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Sin alertas activas</div>
              <div style={{ fontSize: 14 }}>Actívalas desde la página de cualquier producto</div>
            </div>
          ) : alertas.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 1.25rem', borderBottom: i < alertas.length - 1 ? '1px solid var(--gris-100)' : 'none' }}>
              <span style={{ fontSize: 22 }}>🔔</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.producto_nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--gris-400)' }}>
                  Precio actual: <strong>${Number(a.precio_actual || 0).toFixed(2)}</strong>
                  {a.precio_objetivo && ` · Meta: $${Number(a.precio_objetivo).toFixed(2)}`}
                  {' · Avisa con >='}{a.descuento_minimo}% descuento
                </div>
              </div>
              <button onClick={async () => { await alertsAPI.delete(a.id); setAlertas(p => p.filter(x => x.id !== a.id)); }}
                style={{ background: 'var(--rojo-claro)', color: 'var(--rojo)', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => { logout(); navigate('/'); }} style={{ marginTop: '1.5rem', width: '100%', padding: '12px', background: 'none', border: '1px solid var(--gris-200)', borderRadius: 10, color: 'var(--gris-500)', fontSize: 14, cursor: 'pointer' }}>
        Cerrar sesión
      </button>
    </div>
  );
}
