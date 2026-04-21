import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useState } from 'react';

const NAV = [
  { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/admin/productos', label: 'Productos', icon: '🛍️' },
  { path: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { path: '/admin/contribuciones', label: 'Contribuciones', icon: '📝' },
  { path: '/admin/logs', label: 'Actividad', icon: '📋' },
];

// Login directo para el panel admin — sin redirigir al login público
function AdminLoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Credenciales incorrectas'); return; }
      if (!['admin', 'superadmin'].includes(data.user?.role)) {
        setError('Esta cuenta no tiene permisos de administrador'); return;
      }
      onLogin(data.user, data.token);
    } catch (err) {
      setError('Error de conexión. ¿Está corriendo el backend?');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginBottom: 6 }}>
            Ahorra<span style={{ color: '#4ade80' }}>Ya</span>
          </div>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Panel de Administración
          </div>
        </div>

        <div style={{ background: '#1e293b', borderRadius: 16, padding: '2rem', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: '1.5rem', textAlign: 'center' }}>
            🔐 Acceso admin
          </h2>

          {error && (
            <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@ahorraya.ec" autoFocus
                style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 15 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 15 }} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: loading ? '#334155' : '#16a34a', color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4
            }}>
              {loading ? 'Verificando...' : 'Ingresar al panel'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <Link to="/" style={{ fontSize: 13, color: '#475569' }}>← Volver al sitio público</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, token, setAuth, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = token && ['admin', 'superadmin'].includes(user?.role);

  // Mostrar login propio del admin si no está autenticado o no tiene rol
  if (!isAdmin) {
    return <AdminLoginForm onLogin={(u, t) => setAuth(u, t)} />;
  }

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0f172a', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>
            Ahorra<span style={{ color: '#4ade80' }}>Ya</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Panel Admin</div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none',
              background: isActive(item.path, item.exact) ? '#1e293b' : 'transparent',
              color: isActive(item.path, item.exact) ? '#f1f5f9' : '#94a3b8',
              transition: 'all 0.15s'
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {isActive(item.path, item.exact) && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              )}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontWeight: 700, fontSize: 13 }}>
              {user.nombre?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{user.nombre}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>{user.role}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/admin'); }} style={{ width: '100%', padding: '7px', borderRadius: 7, fontSize: 13, background: '#1e293b', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>{NAV.find(n => isActive(n.path, n.exact))?.label || 'Admin'}</div>
          <Link to="/" style={{ fontSize: 13, color: '#64748b' }}>← Ver sitio público</Link>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
