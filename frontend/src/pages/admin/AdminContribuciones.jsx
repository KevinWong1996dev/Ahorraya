import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/adminApi';

function ImgWithFallback({ src }) {
  const [err, setErr] = useState(false);
  if (err) return <><span style={{ fontSize:22, opacity:0.4 }}>📷</span><span style={{ fontSize:9, color:'#94a3b8' }}>Error carga</span></>;
  return <img src={src} alt="evidencia" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={()=>setErr(true)} />;
}

const SUP_LABELS = { supermaxi:'Supermaxi', megamaxi:'Megamaxi', aki:'Akí', tia:'Tía' };
const SUP_COLORS = { supermaxi:'#E31837', megamaxi:'#C01028', aki:'#FF6B00', tia:'#00529B' };

export function AdminContribuciones() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pendientes');
  const [fotoModal, setFotoModal] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await adminAPI.getContribuciones();
    setItems(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pendientes = items.filter(c => !c.validado);
  const aprobadas = items.filter(c => c.validado);
  const lista = tab === 'pendientes' ? pendientes : aprobadas;

  const handleAprobar = async (c) => {
    try {
      await adminAPI.aprobarContribucion(c.id);
      setItems(prev => prev.map(i => i.id === c.id ? { ...i, validado: true } : i));
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const handleRechazar = async (id) => {
    if (!confirm('¿Rechazar y eliminar esta contribución?')) return;
    await adminAPI.rechazarContribucion(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Contribuciones</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
          Modera los precios enviados por usuarios antes de publicarlos.
          {pendientes.length > 0 && <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 99, fontWeight: 700, fontSize: 12 }}>⚠️ {pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', background: '#f1f5f9', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'pendientes', label: `⏳ Pendientes (${pendientes.length})` },
          { id: 'aprobadas',  label: `✅ Aprobadas (${aprobadas.length})` }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: tab === t.id ? '#fff' : 'transparent', color: tab === t.id ? '#0f172a' : '#64748b', border: 'none', cursor: 'pointer', boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
      ) : lista.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{tab === 'pendientes' ? '✅' : '📝'}</div>
          <div style={{ fontWeight: 600 }}>{tab === 'pendientes' ? '¡Sin pendientes!' : 'Sin aprobadas aún'}</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{tab === 'pendientes' ? 'Todas las contribuciones han sido revisadas' : 'Aprueba contribuciones desde la pestaña pendientes'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lista.map(c => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${!c.validado ? '#fcd34d' : '#bbf7d0'}`, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 1.25rem' }}>
                {/* Foto */}
                <div style={{ width: 70, height: 70, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: '#f1f5f9', cursor: (c.foto_url && c.foto_url !== 'pendiente_de_subida') ? 'pointer' : 'default', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}
                  onClick={() => c.foto_url && c.foto_url !== 'pendiente_de_subida' && setFotoModal(c.foto_url)}>
                  {c.foto_url && c.foto_url !== 'pendiente_de_subida'
                    ? <ImgWithFallback src={c.foto_url} />
                    : <>
                        <span style={{ fontSize: 22, opacity: 0.4 }}>📷</span>
                        <span style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>{c.foto_url === 'pendiente_de_subida' ? 'Sin Cloudinary' : 'Sin foto'}</span>
                      </>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 3 }}>{c.producto_nombre}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#16a34a' }}>${Number(c.precio).toFixed(2)}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 99, background: `${SUP_COLORS[c.supermercado]}15`, color: SUP_COLORS[c.supermercado], fontWeight: 700, fontSize: 12 }}>
                      {SUP_LABELS[c.supermercado]}
                    </span>
                    <span style={{ color: '#64748b' }}>por <strong>{c.usuario_nombre || 'Anónimo'}</strong></span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(c.created_at).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {(!c.foto_url || c.foto_url === 'pendiente_de_subida') && <div style={{ marginTop: 4, fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⚠️ Sin foto de evidencia</div>}
                  {c.foto_url && c.foto_url !== 'pendiente_de_subida' && <div style={{ marginTop: 4, fontSize: 12, color: '#16a34a', fontWeight: 600, cursor: 'pointer' }} onClick={() => setFotoModal(c.foto_url)}>📷 Ver foto →</div>}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {!c.validado ? (
                    <>
                      <button onClick={() => handleAprobar(c)} style={{ padding: '7px 16px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #86efac', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ✅ Aprobar
                      </button>
                      <button onClick={() => handleRechazar(c.id)} style={{ padding: '7px 16px', borderRadius: 8, background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fca5a5', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ❌ Rechazar
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ padding: '6px 14px', borderRadius: 8, background: '#dcfce7', color: '#16a34a', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>✅ Aprobada</span>
                      <button onClick={() => handleRechazar(c.id)} style={{ padding: '6px 14px', borderRadius: 8, background: '#fef2f2', color: '#ef4444', border: 'none', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal foto ampliada */}
      {fotoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setFotoModal(null)}>
          <div style={{ position: 'relative', maxWidth: 600, maxHeight: '90vh' }}>
            <img src={fotoModal} alt="evidencia" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }} />
            <button style={{ position: 'absolute', top: -16, right: -16, width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminAPI.getLogs().then(r => setLogs(r.data)).finally(() => setLoading(false)); }, []);
  const getStyle = (a) => {
    if (a?.includes('CREATE')) return { bg:'#dcfce7', color:'#16a34a', icon:'✅' };
    if (a?.includes('DELETE')) return { bg:'#fef2f2', color:'#ef4444', icon:'🗑️' };
    if (a?.includes('UPDATE')) return { bg:'#eff6ff', color:'#2563eb', icon:'✏️' };
    return { bg:'#f1f5f9', color:'#64748b', icon:'📋' };
  };
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}><h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Actividad</h1></div>
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Cargando...</div>
        : logs.length === 0 ? <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}><div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>Sin actividad</div>
        : logs.map((log, i) => {
          const s = getStyle(log.accion);
          return (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px', borderBottom: i < logs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#0f172a' }}><strong>{log.admin_nombre || 'Admin'}</strong> <span style={{ fontSize: 12, padding: '2px 7px', borderRadius: 99, background: s.bg, color: s.color, fontWeight: 700 }}>{log.accion}</span></div>
                {log.detalle && Object.keys(log.detalle).length > 0 && <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{JSON.stringify(log.detalle)}</div>}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
