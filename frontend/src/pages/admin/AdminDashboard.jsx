import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/adminApi';

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [logs, setLogs]         = useState([]);
  const [categorias, setCats]   = useState([]);
  const [nuevaCat, setNuevaCat] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [catMsg, setCatMsg]     = useState('');

  useEffect(() => {
    adminAPI.stats().then(r => setStats(r.data)).catch(()=>{});
    adminAPI.getLogs().then(r => setLogs(r.data.slice(0,6))).catch(()=>{});
    // Load categories as objects with id+nombre
    adminAPI.getCategorias()
      .then(r => setCats(r.data.map(c => ({ id: c.id, nombre: c.nombre }))))
      .catch(()=>{});
  }, []);

  const handleAddCat = async (e) => {
    e.preventDefault();
    const nombre = nuevaCat.trim();
    if (!nombre) return;
    setCatLoading(true); setCatMsg('');
    try {
      const res = await adminAPI.createCategoria(nombre);
      setCats(prev => [...prev, { id: res.data.id, nombre: res.data.nombre }]
        .sort((a,b) => a.nombre.localeCompare(b.nombre)));
      setNuevaCat('');
      setCatMsg('✅ Categoría agregada');
      setTimeout(() => setCatMsg(''), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al agregar';
      setCatMsg('❌ ' + msg);
    } finally { setCatLoading(false); }
  };

  const handleDeleteCat = async (id, nombre) => {
    if (!confirm(`¿Eliminar categoría "${nombre}"?`)) return;
    try {
      await adminAPI.deleteCategoria(id);
      setCats(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const STAT_CARDS = [
    { label:'Productos',      value:stats?.productos,      icon:'🛍️', color:'#4ade80', path:'/admin/productos' },
    { label:'Usuarios',       value:stats?.usuarios,       icon:'👥', color:'#60a5fa', path:'/admin/usuarios' },
    { label:'Contribuciones', value:stats?.contribuciones, icon:'📝', color:'#f59e0b', path:'/admin/contribuciones' },
    { label:'Categorías',     value:categorias.length,     icon:'🏷️', color:'#a78bfa', path:null },
  ];

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:800, marginBottom:'1.5rem', color:'#0f172a' }}>Dashboard</h1>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:'1.5rem' }}>
        {STAT_CARDS.map(s => {
          const inner = (
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:'1.25rem', transition:'box-shadow 0.15s', cursor:s.path?'pointer':'default' }}
              onMouseEnter={e => s.path && (e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)')}
              onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</span>
                <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize:32, fontWeight:800, color:s.color, fontFamily:'var(--font-display)' }}>{stats !== null ? (s.value ?? 0) : '—'}</div>
            </div>
          );
          return s.path
            ? <Link key={s.label} to={s.path} style={{ textDecoration:'none' }}>{inner}</Link>
            : <div key={s.label}>{inner}</div>;
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Categorías */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:'1.25rem' }}>
          <h2 style={{ fontSize:15, fontWeight:700, marginBottom:'1rem', color:'#0f172a' }}>🏷️ Categorías de productos</h2>

          <div style={{ display:'flex', gap:8, marginBottom:'0.75rem' }}>
            <input
              value={nuevaCat}
              onChange={e => setNuevaCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCat(e)}
              placeholder="Nombre de nueva categoría..."
              style={{ flex:1, padding:'9px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14 }}
            />
            <button
              onClick={handleAddCat}
              disabled={catLoading || !nuevaCat.trim()}
              style={{
                padding:'9px 16px', borderRadius:8, fontSize:13, fontWeight:700, border:'none',
                background: catLoading || !nuevaCat.trim() ? '#e2e8f0' : '#16a34a',
                color:      catLoading || !nuevaCat.trim() ? '#94a3b8' : '#fff',
                cursor:     catLoading || !nuevaCat.trim() ? 'not-allowed' : 'pointer',
                whiteSpace:'nowrap'
              }}>
              {catLoading ? '...' : '+ Agregar'}
            </button>
          </div>

          {catMsg && (
            <div style={{ fontSize:13, padding:'7px 10px', borderRadius:7, marginBottom:'0.75rem', background: catMsg.startsWith('✅')?'#f0fdf4':'#fef2f2', color: catMsg.startsWith('✅')?'#16a34a':'#ef4444', fontWeight:600 }}>
              {catMsg}
            </div>
          )}

          <div style={{ maxHeight:300, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
            {categorias.length === 0 ? (
              <div style={{ color:'#94a3b8', fontSize:13, padding:'1rem', textAlign:'center' }}>
                {stats === null ? 'Cargando...' : 'Sin categorías. Crea la primera.'}
              </div>
            ) : categorias.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:8, background:'#f8fafc', border:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:13, fontWeight:500, color:'#334155' }}>🏷️ {c.nombre}</span>
                <button
                  onClick={() => handleDeleteCat(c.id, c.nombre)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', fontSize:16, padding:'2px 6px', borderRadius:5, lineHeight:1 }}
                  onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color='#cbd5e1'}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones rápidas + logs */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:'1.25rem' }}>
            <h2 style={{ fontSize:15, fontWeight:700, marginBottom:'1rem', color:'#0f172a' }}>⚡ Acciones rápidas</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'+ Nuevo producto',      path:'/admin/productos?nuevo=1', color:'#4ade80' },
                { label:'+ Nuevo usuario admin',  path:'/admin/usuarios?nuevo=1',  color:'#60a5fa' },
                { label:'Moderar contribuciones', path:'/admin/contribuciones',    color:'#f59e0b' },
                { label:'Ver actividad',          path:'/admin/logs',              color:'#a78bfa' },
              ].map(a => (
                <Link key={a.label} to={a.path} style={{ display:'block', padding:'9px 14px', borderRadius:8, fontSize:14, fontWeight:600, color:a.color, background:`${a.color}12`, textDecoration:'none', border:`1px solid ${a.color}30` }}>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:'1.25rem', flex:1 }}>
            <h2 style={{ fontSize:15, fontWeight:700, marginBottom:'1rem', color:'#0f172a' }}>📋 Actividad reciente</h2>
            {logs.length === 0
              ? <div style={{ color:'#94a3b8', fontSize:13 }}>Sin actividad aún</div>
              : logs.map(log => (
                <div key={log.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:8 }}>
                  <span>{log.accion?.includes('CREATE')?'✅':log.accion?.includes('DELETE')?'🗑️':'✏️'}</span>
                  <span style={{ color:'#475569', flex:1 }}><strong>{log.admin_nombre||'Admin'}</strong> — {log.accion}</span>
                  <span style={{ color:'#94a3b8', fontSize:11 }}>{new Date(log.created_at).toLocaleTimeString('es-EC',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
