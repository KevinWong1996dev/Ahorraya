import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/adminApi';

const SUP_LABELS = { supermaxi: 'Supermaxi', megamaxi: 'Megamaxi', aki: 'Akí', tia: 'Tía' };
const SUP_COLORS = { supermaxi: '#E31837', megamaxi: '#C01028', aki: '#FF6B00', tia: '#00529B' };

const UNIDADES = ['L','ml','kg','g','unidad','pack','par','docena','rollo','sobre','caja','funda','tarro','botella','bolsa'];

const EMPTY = { nombre:'', categoria:'', marca:'', codigo_barras:'', imagen_url:'', descripcion:'', unidad:'', peso_neto:'' };

const labelStyle = { display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' };
const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14 };
const btnPrimary = { padding:'9px 20px', borderRadius:9, fontSize:14, fontWeight:700, border:'none', cursor:'pointer' };
const btnSecondary = { padding:'9px 20px', borderRadius:9, border:'1px solid #e2e8f0', background:'#fff', fontSize:14, cursor:'pointer', color:'#475569' };

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color:'#ef4444', marginLeft:3 }}>*</span>}</label>
      <input value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function Msg({ text }) {
  const ok = text.startsWith('✅');
  return <div style={{ marginTop:'1rem', padding:'10px 14px', borderRadius:8, background: ok?'#f0fdf4':'#fef2f2', color: ok?'#16a34a':'#ef4444', fontSize:14 }}>{text}</div>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth: wide?640:600, maxHeight:'90vh', overflow:'auto', padding:'1.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:19, fontWeight:800 }}>{title}</h2>
          <button onClick={onClose} style={{ fontSize:24, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminProductos() {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [preciosMap, setPreciosMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    adminAPI.getCategorias().then(r => setCategorias(r.data.map(c => c.nombre))).catch(() => {});
    if (searchParams.get('nuevo')) openCreate();
  }, []);

  const load = async (search=q, p=page) => {
    setLoading(true);
    try {
      const res = await adminAPI.getProductos({ q: search||undefined, page:p, limit:15 });
      setProductos(res.data.data);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(q,1); }, 300);
  }, [q]);

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const openCreate = () => { setForm(EMPTY); setEditingId(null); setModal('create'); setMsg(''); };
  const openEdit = (p) => { setForm({...p}); setEditingId(p.id); setModal('edit'); setMsg(''); };

  const openPrecios = async (p) => {
    setEditingId(p.id); setForm(p);
    const res = await adminAPI.getPrecios(p.id);
    const map = {};
    res.data.forEach(r => { map[r.supermercado] = { ...r, enabled:true }; });
    setPreciosMap(map);
    setModal('precios');
  };

  // Validación de campos obligatorios
  const camposFaltantes = () => {
    const reqs = { nombre:'Nombre', categoria:'Categoría', marca:'Marca', unidad:'Unidad', peso_neto:'Peso/Contenido', imagen_url:'Imagen URL' };
    return Object.entries(reqs).filter(([k]) => !form[k]?.trim()).map(([,v]) => v);
  };

  const handleSave = async () => {
    const faltantes = camposFaltantes();
    if (faltantes.length > 0) { setMsg(`❌ Campos obligatorios: ${faltantes.join(', ')}`); return; }
    setSaving(true); setMsg('');
    try {
      if (editingId) {
        await adminAPI.updateProducto(editingId, form);
        setMsg('✅ Producto actualizado');
      } else {
        await adminAPI.createProducto(form);
        setMsg('✅ Producto creado');
      }
      await load();
      setTimeout(() => setModal(null), 900);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error al guardar'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?\nEsto también borra sus precios e historial.`)) return;
    try {
      await adminAPI.deleteProducto(id);
      // Solo recargar sin tocar otros productos
      setProductos(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  const updatePrecio = (sup, field, val) => {
    setPreciosMap(prev => {
      const updated = { ...prev, [sup]: { ...(prev[sup]||{}), [field]: val } };
      if (field === 'precio' || field === 'precio_anterior') {
        const p = parseFloat(field==='precio' ? val : updated[sup]?.precio);
        const pa = parseFloat(field==='precio_anterior' ? val : updated[sup]?.precio_anterior);
        if (!isNaN(p) && !isNaN(pa) && pa > 0 && p > 0) {
          updated[sup].descuento_porcentaje = pa > p ? ((pa-p)/pa*100).toFixed(1) : null;
          updated[sup].aumento = p > pa;
        } else {
          updated[sup].descuento_porcentaje = null;
          updated[sup].aumento = false;
        }
      }
      return updated;
    });
  };

  const handleSavePrecio = async (sup) => {
    const d = preciosMap[sup];
    if (!d?.precio) return;
    try {
      await adminAPI.upsertPrecio({
        producto_id: editingId,
        supermercado: sup,
        precio: parseFloat(d.precio),
        precio_anterior: d.precio_anterior ? parseFloat(d.precio_anterior) : null,
        descuento_porcentaje: d.descuento_porcentaje || null,
      });
      setPreciosMap(prev => ({ ...prev, [sup]: { ...prev[sup], saved:true, fecha: new Date().toISOString() } }));
      setTimeout(() => setPreciosMap(prev => ({ ...prev, [sup]: { ...prev[sup], saved:false } })), 1500);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeletePrecio = async (sup) => {
    if (!confirm(`¿Eliminar precio de ${SUP_LABELS[sup]}?`)) return;
    await adminAPI.deletePrecio(editingId, sup);
    setPreciosMap(prev => { const n={...prev}; delete n[sup]; return n; });
  };

  const totalPages = Math.ceil(total/15);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>Productos</h1>
          <div style={{ fontSize:13, color:'#64748b', marginTop:2 }}>{total} productos en total</div>
        </div>
        <button onClick={openCreate} style={{ padding:'9px 18px', background:'#16a34a', color:'#fff', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', border:'none' }}>
          + Nuevo producto
        </button>
      </div>

      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar producto..."
        style={{ width:'100%', padding:'9px 14px', borderRadius:9, border:'1.5px solid #e2e8f0', fontSize:14, marginBottom:'1rem' }} />

      {/* Tabla */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
              {['Producto','Categoría','Marca','Precio desde','Supermercados','Acciones'].map(h => (
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({length:5}).map((_,i) => (
              <tr key={i}><td colSpan={6} style={{ padding:'12px 14px' }}><div className="skeleton" style={{ height:18, borderRadius:4 }} /></td></tr>
            )) : productos.length===0 ? (
              <tr><td colSpan={6} style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📦</div><div>Sin productos. Crea el primero.</div>
              </td></tr>
            ) : productos.map((p,i) => (
              <tr key={p.id} style={{ borderBottom: i<productos.length-1?'1px solid #f1f5f9':'none' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover', border:'1px solid #e2e8f0' }} onError={e=>e.target.style.display='none'} />
                      : <div style={{ width:36, height:36, borderRadius:8, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🛒</div>
                    }
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color:'#0f172a' }}>{p.nombre}</div>
                      {p.codigo_barras && <div style={{ fontSize:11, color:'#94a3b8' }}>{p.codigo_barras}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:'12px 14px', fontSize:13, color:'#475569' }}>{p.categoria||'—'}</td>
                <td style={{ padding:'12px 14px', fontSize:13, color:'#475569' }}>{p.marca||'—'}</td>
                <td style={{ padding:'12px 14px', fontWeight:700, color:'#16a34a', fontSize:14 }}>
                  {p.precio_min ? `$${Number(p.precio_min).toFixed(2)}` : '—'}
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <span style={{ fontSize:12, fontWeight:600, padding:'3px 8px', borderRadius:99, background: p.num_precios>0?'#dcfce7':'#f1f5f9', color: p.num_precios>0?'#16a34a':'#94a3b8' }}>
                    {p.num_precios} sup.
                  </span>
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={()=>openPrecios(p)} style={{ padding:'5px 10px', borderRadius:6, fontSize:12, fontWeight:600, background:'#eff6ff', color:'#2563eb', border:'none', cursor:'pointer' }}>💲</button>
                    <button onClick={()=>openEdit(p)} style={{ padding:'5px 10px', borderRadius:6, fontSize:12, fontWeight:600, background:'#f0fdf4', color:'#16a34a', border:'none', cursor:'pointer' }}>✏️</button>
                    <button onClick={()=>handleDelete(p.id, p.nombre)} style={{ padding:'5px 10px', borderRadius:6, fontSize:12, fontWeight:600, background:'#fef2f2', color:'#ef4444', border:'none', cursor:'pointer' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ padding:'12px 14px', borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
            <button disabled={page===1} onClick={()=>{setPage(p=>p-1); load(q,page-1);}} style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, color:'#475569' }}>← Anterior</button>
            <span style={{ fontSize:13, color:'#64748b' }}>Página {page} de {totalPages}</span>
            <button disabled={page>=totalPages} onClick={()=>{setPage(p=>p+1); load(q,page+1);}} style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, color:'#475569' }}>Siguiente →</button>
          </div>
        )}
      </div>

      {/* ── Modal crear/editar ── */}
      {(modal==='create'||modal==='edit') && (
        <Modal title={modal==='create'?'Nuevo producto':'Editar producto'} onClose={()=>setModal(null)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="Nombre" value={form.nombre} onChange={v=>f('nombre',v)} placeholder="Ej: Leche Entera 1L" required />
            </div>

            {/* Categoría */}
            <div>
              <label style={labelStyle}>Categoría<span style={{ color:'#ef4444', marginLeft:3 }}>*</span></label>
              <select value={form.categoria} onChange={e=>f('categoria',e.target.value)} style={{ ...inputStyle, background:'#fff' }}>
                <option value="">Seleccionar...</option>
                {categorias.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Marca */}
            <Field label="Marca" value={form.marca} onChange={v=>f('marca',v)} placeholder="Ej: Nestlé" required />

            {/* Unidad — lista desplegable */}
            <div>
              <label style={labelStyle}>Unidad<span style={{ color:'#ef4444', marginLeft:3 }}>*</span></label>
              <select value={form.unidad} onChange={e=>f('unidad',e.target.value)} style={{ ...inputStyle, background:'#fff' }}>
                <option value="">Seleccionar...</option>
                {UNIDADES.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Peso */}
            <Field label="Peso / Contenido" value={form.peso_neto} onChange={v=>f('peso_neto',v)} placeholder="Ej: 1L, 500g, 12u" required />

            {/* Código de barras (opcional) */}
            <Field label="Código de barras" value={form.codigo_barras} onChange={v=>f('codigo_barras',v)} placeholder="Ej: 7702001001234" />

            {/* Imagen */}
            <div style={{ gridColumn:'1/-1' }}>
              <Field label="URL de imagen" value={form.imagen_url} onChange={v=>f('imagen_url',v)} placeholder="https://ejemplo.com/imagen.jpg" required />
              {form.imagen_url && (
                <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:10 }}>
                  <img src={form.imagen_url} alt="" style={{ width:56, height:56, objectFit:'cover', borderRadius:8, border:'1px solid #e2e8f0' }} onError={e=>e.target.style.display='none'} />
                  <span style={{ fontSize:12, color:'#94a3b8' }}>Vista previa</span>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>Descripción</label>
              <textarea value={form.descripcion||''} onChange={e=>f('descripcion',e.target.value)} rows={2}
                placeholder="Descripción opcional del producto"
                style={{ ...inputStyle, resize:'vertical' }} />
            </div>
          </div>
          {msg && <Msg text={msg} />}
          <div style={{ display:'flex', gap:10, marginTop:'1.5rem', justifyContent:'flex-end' }}>
            <button onClick={()=>setModal(null)} style={btnSecondary}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, background: saving?'#e2e8f0':'#16a34a', color: saving?'#94a3b8':'#fff' }}>
              {saving?'Guardando...':'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal precios ── */}
      {modal==='precios' && (
        <Modal title={`Precios: ${form.nombre}`} onClose={()=>setModal(null)} wide>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:'1.25rem' }}>
            Activa los supermercados donde está disponible. El % de descuento se calcula automáticamente.
          </p>
          {Object.keys(SUP_LABELS).map(sup => {
            const d = preciosMap[sup]||{};
            const enabled = !!(d.enabled||d.precio);
            const p = parseFloat(d.precio)||0;
            const pa = parseFloat(d.precio_anterior)||0;
            const subio = pa > 0 && p > 0 && p > pa;
            const bajo = pa > 0 && p > 0 && p < pa;
            return (
              <div key={sup} style={{ marginBottom:10, borderRadius:10, border:`1.5px solid ${enabled?SUP_COLORS[sup]+'50':'#e2e8f0'}`, overflow:'hidden' }}>
                {/* Header checkbox */}
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: enabled?`${SUP_COLORS[sup]}08`:'#f8fafc', cursor:'pointer' }}
                  onClick={()=>setPreciosMap(prev=>({ ...prev, [sup]:{ ...(prev[sup]||{}), enabled:!enabled } }))}>
                  <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${enabled?SUP_COLORS[sup]:'#cbd5e1'}`, background: enabled?SUP_COLORS[sup]:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {enabled && <span style={{ color:'#fff', fontSize:11, fontWeight:800 }}>✓</span>}
                  </div>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:SUP_COLORS[sup] }} />
                  <span style={{ fontWeight:700, fontSize:14, color: enabled?'#0f172a':'#94a3b8' }}>{SUP_LABELS[sup]}</span>
                  {d.fecha && <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8' }}>Act: {new Date(d.fecha).toLocaleDateString('es-EC')}</span>}
                </div>

                {/* Campos */}
                {enabled && (
                  <div style={{ padding:'12px 14px', background:'#fff', borderTop:`1px solid ${SUP_COLORS[sup]}20` }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 0.7fr auto auto', gap:8, alignItems:'end' }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize:10 }}>PRECIO ACTUAL *</label>
                        <div style={{ position:'relative' }}>
                          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontWeight:700, fontSize:13 }}>$</span>
                          <input type="number" step="0.01" value={d.precio||''} onChange={e=>updatePrecio(sup,'precio',e.target.value)}
                            placeholder="0.00" style={{ width:'100%', padding:'7px 8px 7px 22px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:14 }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize:10 }}>PRECIO ANTERIOR</label>
                        <div style={{ position:'relative' }}>
                          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontWeight:700, fontSize:13 }}>$</span>
                          <input type="number" step="0.01" value={d.precio_anterior||''} onChange={e=>updatePrecio(sup,'precio_anterior',e.target.value)}
                            placeholder="0.00" style={{ width:'100%', padding:'7px 8px 7px 22px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:14 }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize:10 }}>VARIACIÓN</label>
                        <div style={{
                          padding:'8px 10px', borderRadius:7, border:'1.5px solid #e2e8f0',
                          background: subio?'#fef2f2': bajo?'#f0fdf4':'#f8fafc',
                          color: subio?'#ef4444': bajo?'#16a34a':'#94a3b8',
                          fontWeight:700, fontSize:13, textAlign:'center'
                        }}>
                          {subio ? `▲ +${((p-pa)/pa*100).toFixed(1)}%` : bajo ? `▼ -${((pa-p)/pa*100).toFixed(1)}%` : '—'}
                        </div>
                      </div>
                      <button onClick={()=>handleSavePrecio(sup)} disabled={!d.precio}
                        style={{ padding:'7px 14px', borderRadius:7, background: d.saved?'#dcfce7':(!d.precio?'#e2e8f0':'#16a34a'), color: d.saved?'#16a34a':(!d.precio?'#94a3b8':'#fff'), fontSize:13, fontWeight:700, border:'none', cursor: d.precio?'pointer':'default', whiteSpace:'nowrap' }}>
                        {d.saved?'✓':'Guardar'}
                      </button>
                      {d.fecha && (
                        <button onClick={()=>handleDeletePrecio(sup)} style={{ padding:'7px 10px', borderRadius:7, background:'#fef2f2', color:'#ef4444', fontSize:13, border:'none', cursor:'pointer' }}>🗑️</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Modal>
      )}
    </div>
  );
}
