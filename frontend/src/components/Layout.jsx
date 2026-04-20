import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import { useState } from 'react';

const SUPERMERCADO_COLORES = {
  supermaxi: '#E31837', megamaxi: '#E31837', aki: '#FF6B00', tia: '#00529B'
};

export default function Layout() {
  const cartItems = useCartStore(s => s.items);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const totalItems = cartItems.reduce((a, i) => a + i.cantidad, 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid var(--gris-200)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem', display: 'flex', alignItems: 'center', height: 60, gap: '1.5rem' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, background: 'var(--verde)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)'
            }}>A</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--gris-900)' }}>
              Ahorra<span style={{ color: 'var(--verde)' }}>Ya</span>
            </span>
          </Link>

          {/* Nav links - desktop */}
          <div style={{ display: 'flex', gap: '0.25rem', flex: 1, alignItems: 'center' }}>
            {[
              { path: '/', label: 'Buscar' },
              { path: '/carrito', label: 'Carrito' },
              { path: '/contribuir', label: 'Contribuir' }
            ].map(({ path, label }) => (
              <Link key={path} to={path} style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: location.pathname === path ? 'var(--verde)' : 'var(--gris-600)',
                background: location.pathname === path ? 'var(--verde-claro)' : 'transparent',
                transition: 'var(--transition)'
              }}>
                {label}
                {path === '/carrito' && totalItems > 0 && (
                  <span style={{
                    marginLeft: 6, background: 'var(--verde)', color: '#fff',
                    fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99
                  }}>{totalItems}</span>
                )}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to="/perfil" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--verde-claro)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--verde)'
                  }}>
                    {user.nombre?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris-800)' }}>{user.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--verde)', fontWeight: 600 }}>
                      ★ {user.puntos || 0} pts
                    </div>
                  </div>
                </Link>
                <button onClick={() => { logout(); navigate('/'); }} style={{
                  fontSize: 13, color: 'var(--gris-400)', background: 'none',
                  padding: '4px 8px', borderRadius: 6
                }}>Salir</button>
              </div>
            ) : (
              <>
                <Link to="/login" style={{
                  fontSize: 14, fontWeight: 500, color: 'var(--gris-600)',
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid var(--gris-200)'
                }}>Ingresar</Link>
                <Link to="/registro" style={{
                  fontSize: 14, fontWeight: 600, color: '#fff',
                  padding: '7px 14px', borderRadius: 8,
                  background: 'var(--verde)'
                }}>Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem', width: '100%' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--gris-900)', color: 'var(--gris-400)', padding: '2rem 1rem', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: 18, marginBottom: 4 }}>
              Ahorra<span style={{ color: 'var(--verde)' }}>Ya</span>
            </div>
            <div style={{ fontSize: 13 }}>Compara precios en Supermaxi, Akí, Tía y más.</div>
          </div>
          <div style={{ fontSize: 12 }}>
            © 2025 AhorraYa Ecuador · Precios referenciales, verificar en tienda
          </div>
        </div>
      </footer>
    </div>
  );
}
