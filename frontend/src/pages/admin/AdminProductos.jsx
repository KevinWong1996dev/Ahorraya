import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/adminApi';

const SUPERMERCADOS = ['supermaxi', 'megamaxi', 'aki', 'tia'];
const SUP_LABELS = { supermaxi: 'Supermaxi', megamaxi: 'Megamaxi', aki: 'Akí', tia: 'Tía' };
const CATEGORIAS = ['Lácteos', 'Granos y Cereales', 'Aceites y Condimentos', 'Azúcares y Endulzantes', 'Panadería', 'Huevos y Lácteos', 'Conservas', 'Limpieza del Hogar', 'Cuidado Personal', 'Bebidas', 'Pastas y Fideos', 'Condimentos', 'Higiene', 'Carnes y Aves', 'Frutas y Verduras', 'Snacks', 'Otros'];

const EMPTY_PRODUCT = { nombre: '', categoria: '', subcategoria: '', marca: '', codigo_barras: '', imagen_url: '', descripcion: '', unidad: '', peso_neto: '' };

export default function AdminProductos() {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'precios'
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState(null);
  const [precios, setPrecios] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (searchParams.get('nuevo')) openCreate();
  }, []);

  const load = async (search = q, p = page) => {
    setLoading(true);
    try {
      const res = await adminAPI.getProductos({ q: search || undefined, page: p, limit: 15 });
      setProductos(res.data.data);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(q, 1), 300);
  }, [q]);

  const openCreate = () => { setForm(EMPTY_PRODUCT); setEditingId(null); setModal('create'); setMsg(''); };
  const openEdit = (p) => { setForm({ ...p }); setEditingId(p.id); setModal('edit'); setMsg(''); };
  const openPrecios = async (p) => {
    setEditingId(p.id);
    setForm(p);
    setModal('precios');
    const res = await adminAPI.getPrecios(p.id);
    const map = {};
    res.data.forEach(r => { map[r.supermercado] = r; });
    setPrecios(map);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await adminAPI.updateProducto(editingId, form);
        setMsg('✅ Producto actualizado');
      } else {
        await adminAPI.createProducto(form);
        setMsg('✅ Producto creado');
      }
      await load();
      setTimeout(() => setModal(null), 800);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error al guardar'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esto también borra sus precios e historial.`)) return;
    await adminAPI.deleteProducto(id);
    await load();
  };

  const handleSavePrecio = async (sup, precio, precioAnterior, descuento) => {
    try {
      await adminAPI.upsertPrecio({ producto_id: editingId, supermercado: sup, precio: parseFloat(precio), precio_anterior: precioAnterior ? parseFloat(precioAnterior) : null, descuento_porcentaje: descuento ? parseFloat(descuento) : null });
      const res = await adminAPI.getPrecios(editingId);
      const map = {};
      res.data.forEach(r => { map[r.supermercado] = r; });
      setPrecios(map);
    } catch (err) { alert('Error al guardar precio'); }
  };

  const handleDeletePrecio = async (sup) => {
    if (!confirm(`¿Eliminar precio de ${SUP_LABELS[sup]}?`)) return;
    await adminAPI.deletePrecio(editingId, sup);
    const updated = { ...precios };
    delete updated[sup];
    setPrecios(updated);
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Productos</h1>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{total} productos en total</div>
        </div>
        <button onClick={openCreate} style={{ padding: '9px 18px', background: '#16a34a', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
          + Nuevo producto
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto..." style={{ flex: 1, padding: '9px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 14 }} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Producto', 'Categoría', 'Marca', 'Precio desde', 'Precios', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6} style={{ padding: '10px 14px' }}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td></tr>
              ))
            ) : productos.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < productos.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', background: '#f1f5f9' }} onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛒</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{p.nombre}</div>
                      {p.codigo_barras && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.codigo_barras}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#475569' }}>{p.categoria || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#475569' }}>{p.marca || '—'}</td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#16a34a', fontSize: 14 }}>
                  {p.precio_min ? `$${Number(p.precio_min).toFixed(2)}` : '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 12, background: p.num_precios > 0 ? '#dcfce7' : '#f1f5f9', color: p.num_precios > 0 ? '#16a34a' : '#94a3b8', padding: '3px 8px', borderRadius: 99, fontWeight: 600 }}>
                    {p.num_precios} supermercado{p.num_precios !== 1 ? 's' : ''}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openPrecios(p)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer' }}>💲 Precios</button>
                    <button onClick={() => openEdit(p)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#16a34a', border: 'none', cursor: 'pointer' }}>✏️ Editar</button>
                    <button onClick={() => handleDelete(p.id, p.nombre)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fef2f2', color: '#ef4444', border: 'none', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(q, page - 1); }}
              style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#475569' }}>← Anterior</button>
            <span style={{ fontSize: 13, color: '#64748b' }}>Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); load(q, page + 1); }}
              style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#475569' }}>Siguiente →</button>
          </div>
        )}
      </div>

      {/* Modal create/edit */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{modal === 'create' ? 'Nuevo producto' : 'Editar producto'}</h2>
              <button onClick={() => setModal(null)} style={{ fontSize: 22, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Nombre *" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Ej: Leche Entera La Lechera 1L" />
              </div>
              <SelectField label="Categoría" value={form.categoria} onChange={v => setForm(f => ({ ...f, categoria: v }))} options={CATEGORIAS} />
              <Field label="Marca" value={form.marca} onChange={v => setForm(f => ({ ...f, marca: v }))} placeholder="Ej: Nestlé" />
              <Field label="Código de barras" value={form.codigo_barras} onChange={v => setForm(f => ({ ...f, codigo_barras: v }))} placeholder="Ej: 7702001001234" />
              <Field label="Unidad" value={form.unidad} onChange={v => setForm(f => ({ ...f, unidad: v }))} placeholder="Ej: L, kg, g, ml" />
              <Field label="Peso / Contenido" value={form.peso_neto} onChange={v => setForm(f => ({ ...f, peso_neto: v }))} placeholder="Ej: 1L, 500g" />
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>URL de imagen</label>
                <input value={form.imagen_url} onChange={e => setForm(f => ({ ...f, imagen_url: e.target.value }))} placeholder="https://ejemplo.com/imagen.jpg"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 }} />
                {form.imagen_url && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={form.imagen_url} alt="preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} onError={e => e.target.style.display = 'none'} />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Vista previa</span>
                  </div>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} placeholder="Descripción opcional del producto"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, resize: 'vertical' }} />
              </div>
            </div>

            {msg && <div style={{ marginTop: '1rem', padding: '10px 14px', borderRadius: 8, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#ef4444', fontSize: 14 }}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#475569' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.nombre} style={{ padding: '9px 20px', borderRadius: 9, background: saving || !form.nombre ? '#e2e8f0' : '#16a34a', color: saving || !form.nombre ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal precios */}
      {modal === 'precios' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflow: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Precios: {form.nombre}</h2>
              <button onClick={() => setModal(null)} style={{ fontSize: 22, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: '1.5rem' }}>Edita el precio por supermercado. Los cambios se reflejan inmediatamente en la app.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SUPERMERCADOS.map(sup => (
                <PrecioRow key={sup} sup={sup} label={SUP_LABELS[sup]} data={precios[sup]}
                  onSave={(precio, anterior, descuento) => handleSavePrecio(sup, precio, anterior, descuento)}
                  onDelete={() => handleDeletePrecio(sup)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 }} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PrecioRow({ sup, label, data, onSave, onDelete }) {
  const [precio, setPrecio] = useState(data?.precio || '');
  const [anterior, setAnterior] = useState(data?.precio_anterior || '');
  const [descuento, setDescuento] = useState(data?.descuento_porcentaje || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const SUP_COLORS = { supermaxi: '#E31837', megamaxi: '#C01028', aki: '#FF6B00', tia: '#00529B' };

  const save = async () => {
    if (!precio) return;
    setSaving(true);
    await onSave(precio, anterior, descuento);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: SUP_COLORS[sup] }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{label}</span>
        {data && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>Actualizado: {new Date(data.fecha).toLocaleDateString('es-EC')}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 8, alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PRECIO *</label>
          <input type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0.00"
            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0', fontSize: 14, marginTop: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PRECIO ANTERIOR</label>
          <input type="number" step="0.01" value={anterior} onChange={e => setAnterior(e.target.value)} placeholder="0.00"
            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0', fontSize: 14, marginTop: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>DESCUENTO %</label>
          <input type="number" step="1" value={descuento} onChange={e => setDescuento(e.target.value)} placeholder="0"
            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0', fontSize: 14, marginTop: 4 }} />
        </div>
        <button onClick={save} disabled={saving || !precio} style={{ padding: '7px 14px', borderRadius: 7, background: saved ? '#dcfce7' : '#16a34a', color: saved ? '#16a34a' : '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', alignSelf: 'flex-end' }}>
          {saving ? '...' : saved ? '✓' : 'Guardar'}
        </button>
        {data && <button onClick={onDelete} style={{ padding: '7px 10px', borderRadius: 7, background: '#fef2f2', color: '#ef4444', fontSize: 13, border: 'none', cursor: 'pointer', alignSelf: 'flex-end' }}>🗑️</button>}
      </div>
    </div>
  );
}
