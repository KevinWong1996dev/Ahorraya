// Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authAPI.login(form);
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '3rem auto' }}>
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '2.5rem', border: '1px solid var(--gris-200)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Bienvenido</h1>
          <p style={{ color: 'var(--gris-400)', fontSize: 14 }}>Ingresa para guardar tu carrito y alertas</p>
        </div>

        {error && (
          <div style={{ background: 'var(--rojo-claro)', color: 'var(--rojo)', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris-700)', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required placeholder="tu@email.com"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--gris-200)', fontSize: 15 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris-700)', display: 'block', marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--gris-200)', fontSize: 15 }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: '12px', background: 'var(--verde)', color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700 }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 14, color: 'var(--gris-400)' }}>
          ¿No tienes cuenta? <Link to="/registro" style={{ color: 'var(--verde)', fontWeight: 600 }}>Regístrate gratis</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--gris-300)' }}>
          Demo: demo@ahorraya.ec / demo123
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authAPI.register(form);
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '3rem auto' }}>
      <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', padding: '2.5rem', border: '1px solid var(--gris-200)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Crear cuenta</h1>
          <p style={{ color: 'var(--gris-400)', fontSize: 14 }}>Gratis. Empieza a ahorrar hoy.</p>
        </div>

        {error && (
          <div style={{ background: 'var(--rojo-claro)', color: 'var(--rojo)', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Tu nombre' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com' },
            { key: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres' }
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gris-700)', display: 'block', marginBottom: 6 }}>{field.label}</label>
              <input type={field.type} value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                required placeholder={field.placeholder}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--gris-200)', fontSize: 15 }} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            style={{ padding: '12px', background: 'var(--verde)', color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700 }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 14, color: 'var(--gris-400)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--verde)', fontWeight: 600 }}>Ingresar</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
