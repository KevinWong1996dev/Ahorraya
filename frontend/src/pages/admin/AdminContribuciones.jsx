// AdminContribuciones.jsx
import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminApi';

const SUP_LABELS = { supermaxi: 'Supermaxi', megamaxi: 'Megamaxi', aki: 'Akí', tia: 'Tía' };
const SUP_COLORS = { supermaxi: '#E31837', megamaxi: '#C01028', aki: '#FF6B00', tia: '#00529B' };

export function AdminContribuciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getContribuciones().then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta contribución?')) return;
    await adminAPI.deleteContribucion(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Contribuciones</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Precios reportados por usuarios. Modera aquí.</div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Producto', 'Usuario', 'Supermercado', 'Precio', 'Votos', 'Validado', 'Fecha', 'Acción'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
                <div>Sin contribuciones aún</div>
              </td></tr>
            ) : items.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 500, color: '#0f172a', maxWidth: 200 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.producto_nombre}</div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#475569' }}>{c.usuario_nombre || 'Anónimo'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${SUP_COLORS[c.supermercado]}15`, color: SUP_COLORS[c.supermercado] }}>
                    {SUP_LABELS[c.supermercado] || c.supermercado}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 800, fontSize: 15, color: '#16a34a' }}>${Number(c.precio).toFixed(2)}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#475569' }}>
                  <span style={{ color: '#16a34a' }}>+{c.votos_positivos}</span> / <span style={{ color: '#ef4444' }}>-{c.votos_negativos}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: c.validado ? '#dcfce7' : '#f1f5f9', color: c.validado ? '#16a34a' : '#94a3b8' }}>
                    {c.validado ? '✅ Validado' : 'Pendiente'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8' }}>
                  {new Date(c.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleDelete(c.id)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fef2f2', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// AdminLogs.jsx
export function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getLogs().then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  const ACCION_STYLES = {
    CREATE: { bg: '#dcfce7', color: '#16a34a', icon: '✅' },
    DELETE: { bg: '#fef2f2', color: '#ef4444', icon: '🗑️' },
    UPDATE: { bg: '#eff6ff', color: '#2563eb', icon: '✏️' },
  };

  const getStyle = (accion) => {
    const key = Object.keys(ACCION_STYLES).find(k => accion?.includes(k));
    return ACCION_STYLES[key] || { bg: '#f1f5f9', color: '#64748b', icon: '📋' };
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Actividad del admin</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Últimas 100 acciones registradas</div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
            <div>Sin actividad registrada aún</div>
          </div>
        ) : logs.map((log, i) => {
          const style = getStyle(log.accion);
          return (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < logs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {style.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#0f172a' }}>
                  <strong>{log.admin_nombre || 'Admin'}</strong>
                  <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 8, padding: '2px 7px', borderRadius: 99, background: style.bg, color: style.color }}>
                    {log.accion}
                  </span>
                </div>
                {log.detalle && Object.keys(log.detalle).length > 0 && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{JSON.stringify(log.detalle)}</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {new Date(log.created_at).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
