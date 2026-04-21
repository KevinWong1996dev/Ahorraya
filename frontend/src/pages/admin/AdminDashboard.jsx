import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data)).catch(() => {});
    adminAPI.getLogs().then(r => setLogs(r.data.slice(0, 8))).catch(() => {});
  }, []);

  const STAT_CARDS = [
    { label: 'Productos', value: stats?.productos, icon: '🛍️', color: '#4ade80', bg: '#f0fdf4', path: '/admin/productos' },
    { label: 'Usuarios', value: stats?.usuarios, icon: '👥', color: '#60a5fa', bg: '#eff6ff', path: '/admin/usuarios' },
    { label: 'Contribuciones', value: stats?.contribuciones, icon: '📝', color: '#f59e0b', bg: '#fffbeb', path: '/admin/contribuciones' },
    { label: 'Ofertas activas', value: stats?.ofertas_activas, icon: '🏷️', color: '#f472b6', bg: '#fdf2f8', path: '/admin/productos' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>Dashboard</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '2rem' }}>
        {STAT_CARDS.map(s => (
          <Link key={s.label} to={s.path} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>
                {stats ? s.value ?? 0 : '—'}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Acciones rápidas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '+ Nuevo producto', path: '/admin/productos?nuevo=1', color: '#4ade80' },
              { label: '+ Nuevo usuario admin', path: '/admin/usuarios?nuevo=1', color: '#60a5fa' },
              { label: 'Moderar contribuciones', path: '/admin/contribuciones', color: '#f59e0b' },
            ].map(a => (
              <Link key={a.label} to={a.path} style={{
                display: 'block', padding: '9px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: a.color, background: `${a.color}12`, textDecoration: 'none',
                border: `1px solid ${a.color}30`
              }}>{a.label}</Link>
            ))}
          </div>
        </div>

        {/* Últimos logs */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Actividad reciente</h2>
          {logs.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>Sin actividad aún</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ fontSize: 14 }}>{getLogEmoji(log.accion)}</span>
                  <span style={{ color: '#475569', flex: 1 }}>
                    <strong>{log.admin_nombre || 'Admin'}</strong> — {log.accion}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>
                    {new Date(log.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getLogEmoji(accion) {
  if (accion?.includes('CREATE')) return '✅';
  if (accion?.includes('DELETE')) return '🗑️';
  if (accion?.includes('UPDATE')) return '✏️';
  return '📋';
}
