import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../services/adminApi';
import { useAuthStore } from '../../store';

const ROLES = ['user', 'admin', 'superadmin'];
const EMPTY = { nombre: '', email: '', password: '', role: 'admin' };
const NIVEL_EMOJI = { novato: '🌱', ahorrador: '💚', experto: '⭐', maestro: '👑' };
const ROLE_COLORS = { user: '#64748b', admin: '#2563eb', superadmin: '#7c3aed' };

export default function AdminUsuarios() {
  const [searchParams] = useSearchParams();
  const { user: me } = useAuthStore();
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (searchParams.get('nuevo')) openCreate(); }, []);
  useEffect(() => { load(); }, [q, page]);

  const load = async () => {
    const res = await adminAPI.getUsuarios({ q: q || undefined, page, limit: 15 });
    setUsuarios(res.data.data);
    setTotal(res.data.total);
  };

  const openCreate = () => { setForm(EMPTY); setEditingId(null); setModal('form'); setMsg(''); };
  const openEdit = (u) => { setForm({ nombre: u.nombre, email: u.email, role: u.role, password: '' }); setEditingId(u.id); setModal('form'); setMsg(''); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await adminAPI.updateUsuario(editingId, form);
        setMsg('✅ Usuario actualizado');
      } else {
        await adminAPI.createUsuario(form);
        setMsg('✅ Usuario creado');
      }
      await load();
      setTimeout(() => setModal(null), 800);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Error'));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, nombre) => {
    if (id === me?.id) return alert('No puedes eliminarte a ti mismo');
    if (!confirm(`¿Eliminar usuario "${nombre}"?`)) return;
    await adminAPI.deleteUsuario(id);
    await load();
  };

  const isSuperAdmin = me?.role === 'superadmin';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Usuarios</h1>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{total} usuarios registrados</div>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreate} style={{ padding: '9px 18px', background: '#2563eb', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none' }}>
            + Nuevo admin
          </button>
        )}
      </div>

      <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Buscar por nombre o email..."
        style={{ width: '100%', padding: '9px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: '1rem' }} />

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Usuario', 'Email', 'Rol', 'Nivel', 'Puntos', 'Contribuciones', 'Registro', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < usuarios.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${ROLE_COLORS[u.role]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: ROLE_COLORS[u.role], fontSize: 14 }}>
                      {u.nombre?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{u.nombre}</span>
                    {u.id === me?.id && <span style={{ fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: 99, fontWeight: 700 }}>Tú</span>}
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#475569' }}>{u.email}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: `${ROLE_COLORS[u.role]}15`, color: ROLE_COLORS[u.role] }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13 }}>{NIVEL_EMOJI[u.nivel]} {u.nivel}</td>
                <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{u.puntos}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#475569', textAlign: 'center' }}>{u.contribuciones}</td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8' }}>
                  {new Date(u.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {isSuperAdmin && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer' }}>✏️ Editar</button>
                      {u.id !== me?.id && (
                        <button onClick={() => handleDelete(u.id, u.nombre)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fef2f2', color: '#ef4444', border: 'none', cursor: 'pointer' }}>🗑️</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal === 'form' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{editingId ? 'Editar usuario' : 'Nuevo usuario admin'}</h2>
              <button onClick={() => setModal(null)} style={{ fontSize: 22, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'nombre', label: 'Nombre', placeholder: 'Nombre completo' },
                { key: 'email', label: 'Email', placeholder: 'correo@ejemplo.com', type: 'email' },
                { key: 'password', label: editingId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *', placeholder: 'Mínimo 6 caracteres', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14 }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {msg && <div style={{ marginTop: '1rem', padding: '10px 14px', borderRadius: 8, background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✅') ? '#16a34a' : '#ef4444', fontSize: 14 }}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#475569' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', borderRadius: 9, background: saving ? '#e2e8f0' : '#2563eb', color: saving ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
