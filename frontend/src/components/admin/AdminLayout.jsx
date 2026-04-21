import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useEffect } from 'react';

const NAV = [
  { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/admin/productos', label: 'Productos', icon: '🛍️' },
  { path: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { path: '/admin/contribuciones', label: 'Contribuciones', icon: '📝' },
  { path: '/admin/logs', label: 'Actividad', icon: '📋' },
];

export default function AdminLayout() {
  const { user, token, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (!['admin', 'superadmin'].includes(user?.role)) { navigate('/'); }
  }, [token, user, navigate]);

  if (!user || !['admin', 'superadmin'].includes(user?.role)) return null;

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0f172a', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>
            Ahorra<span style={{ color: '#4ade80' }}>Ya</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Panel Admin
          </div>
        </div>

        {/* Nav */}
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

        {/* User */}
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
          <button onClick={() => { logout(); navigate('/'); }} style={{
            width: '100%', padding: '7px', borderRadius: 7, fontSize: 13,
            background: '#1e293b', color: '#94a3b8', border: 'none', cursor: 'pointer'
          }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>
            {NAV.find(n => isActive(n.path, n.exact))?.label || 'Admin'}
          </div>
          <Link to="/" style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
            ← Ver sitio público
          </Link>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
