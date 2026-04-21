import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useSearchStore, useCartStore } from '../store';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';

const SUPERMERCADOS = [
  { id: '', label: 'Todos' },
  { id: 'supermaxi', label: 'Supermaxi', color: '#E31837' },
  { id: 'megamaxi', label: 'Megamaxi', color: '#E31837' },
  { id: 'aki', label: 'Akí', color: '#FF6B00' },
  { id: 'tia', label: 'Tía', color: '#00529B' }
];

export default function Home() {
  const navigate = useNavigate();
  const { query, categoria, supermercado, soloOfertas, orden, setQuery, setFiltros } = useSearchStore();
  const addItem = useCartStore(s => s.addItem);

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ofertas, setOfertas] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Cargar categorías
  useEffect(() => {
    productsAPI.categorias().then(r => setCategorias(r.data)).catch(() => {});
    productsAPI.search({ solo_ofertas: true, limit: 6, orden: 'descuento_desc' })
      .then(r => setOfertas(r.data.data)).catch(() => {});
  }, []);

  // Buscar productos con debounce
  const buscar = useCallback(async (q, cat, sup, ofertas, ord, pg = 1) => {
    setLoading(true);
    try {
      const res = await productsAPI.search({
        q: q || undefined,
        categoria: cat || undefined,
        supermercado: sup || undefined,
        solo_ofertas: ofertas || undefined,
        orden: ord,
        page: pg,
        limit: 16
      });
      setProductos(pg === 1 ? res.data.data : prev => [...prev, ...res.data.data]);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      buscar(query, categoria, supermercado, soloOfertas, orden, 1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, categoria, supermercado, soloOfertas, orden, buscar]);

  // Autocompletado
  const handleQueryChange = async (val) => {
    setQuery(val);
    if (val.length >= 2) {
      const res = await productsAPI.autocomplete(val);
      setSuggestions(res.data);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const hayBusqueda = query || categoria || supermercado || soloOfertas;

  return (
    <div>
      {/* Hero / Buscador */}
      {!hayBusqueda && (
        <div style={{
          textAlign: 'center', padding: '3rem 1rem 2rem',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
          borderRadius: 'var(--radius-xl)', marginBottom: '2rem'
        }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', color: 'var(--gris-900)', marginBottom: 12 }}>
            Ahorra más en cada<br/>
            <span style={{ color: 'var(--verde)' }}>compra del mes</span>
          </h1>
          <p style={{ color: 'var(--gris-600)', fontSize: 17, marginBottom: '1.5rem' }}>
            Compara precios en Supermaxi, Akí, Tía y Megamaxi. Gratis.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {SUPERMERCADOS.slice(1).map(s => (
              <span key={s.id} style={{
                background: '#fff', border: `2px solid ${s.color}`,
                color: s.color, borderRadius: 8, padding: '4px 12px',
                fontSize: 13, fontWeight: 600
              }}>{s.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Barra de búsqueda principal */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }} ref={searchRef}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', border: '2px solid var(--gris-200)',
          borderRadius: 'var(--radius-lg)', padding: '10px 16px',
          boxShadow: 'var(--shadow-sm)', transition: 'border-color var(--transition)'
        }}
          onFocus={() => {}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gris-400)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Busca arroz, leche, detergente..."
            style={{
              flex: 1, border: 'none', fontSize: 16, color: 'var(--gris-800)',
              background: 'transparent'
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSuggestions([]); }} style={{
              color: 'var(--gris-400)', background: 'none', fontSize: 18, lineHeight: 1
            }}>×</button>
          )}
        </div>

        {/* Dropdown autocompletado */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#fff', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gris-200)',
            marginTop: 6, overflow: 'hidden'
          }}>
            {suggestions.map(s => (
              <button key={s.id} onClick={() => { navigate(`/producto/${s.id}`); setShowSuggestions(false); }}
                style={{
                  width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center',
                  gap: 10, background: 'none', fontSize: 14, textAlign: 'left',
                  borderBottom: '1px solid var(--gris-100)', color: 'var(--gris-800)'
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gris-400)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--gris-400)' }}>{s.categoria} · {s.marca}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <FilterBar categorias={categorias} supermercados={SUPERMERCADOS} />

      {/* Ofertas destacadas (solo en inicio) */}
      {!hayBusqueda && ofertas.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gris-900)' }}>🔥 Ofertas del momento</h2>
            <span className="badge-naranja">Descuentos reales</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {ofertas.map(p => (
              <ProductCard key={p.id} producto={p} onAddCart={() => addItem(p)} compact />
            ))}
          </div>
        </section>
      )}

      {/* Resultados */}
      {(hayBusqueda || true) && (
        <section>
          {hayBusqueda && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: 18, color: 'var(--gris-800)' }}>
                {loading ? 'Buscando...' : `${productos.length} productos`}
                {query && <span style={{ color: 'var(--verde)', marginLeft: 6 }}>"{query}"</span>}
              </h2>
              <select value={orden} onChange={e => setFiltros({ orden: e.target.value })}
                style={{
                  border: '1px solid var(--gris-200)', borderRadius: 8,
                  padding: '6px 10px', fontSize: 13, color: 'var(--gris-700)',
                  background: '#fff'
                }}>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="descuento_desc">Mayor descuento</option>
                <option value="nombre_asc">Nombre A-Z</option>
              </select>
            </div>
          )}

          {loading && productos.length === 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : productos.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {productos.map((p, i) => (
                  <div key={p.id} className="animate-fade" style={{ animationDelay: `${(i % 8) * 40}ms` }}>
                    <ProductCard producto={p} onAddCart={() => addItem(p)} />
                  </div>
                ))}
              </div>
              {page < totalPages && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button onClick={() => { setPage(p => p + 1); buscar(query, categoria, supermercado, soloOfertas, orden, page + 1); }}
                    style={{
                      padding: '10px 28px', borderRadius: 'var(--radius-md)',
                      background: 'var(--verde)', color: '#fff', fontSize: 15, fontWeight: 600
                    }}>
                    {loading ? 'Cargando...' : 'Ver más productos'}
                  </button>
                </div>
              )}
            </>
          ) : !loading && hayBusqueda ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--gris-400)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Sin resultados</div>
              <div style={{ fontSize: 14 }}>Prueba con otro término o cambia los filtros</div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
