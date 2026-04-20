import { useSearchStore } from '../store';

export default function FilterBar({ categorias, supermercados }) {
  const { categoria, supermercado, soloOfertas, setFiltros, resetFiltros } = useSearchStore();
  const hayFiltros = categoria || supermercado || soloOfertas;

  const chipStyle = (activo) => ({
    padding: '5px 12px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    border: activo ? '2px solid var(--verde)' : '1px solid var(--gris-200)',
    background: activo ? 'var(--verde-claro)' : '#fff',
    color: activo ? 'var(--verde)' : 'var(--gris-600)',
    transition: 'all 0.15s', whiteSpace: 'nowrap'
  });

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {/* Supermercados */}
        {supermercados.map(s => (
          <button
            key={s.id}
            onClick={() => setFiltros({ supermercado: s.id === supermercado ? '' : s.id })}
            style={{
              ...chipStyle(supermercado === s.id && s.id !== ''),
              borderColor: s.id && supermercado === s.id ? s.color : undefined,
              color: s.id && supermercado === s.id ? s.color : undefined,
              background: s.id && supermercado === s.id ? `${s.color}15` : '#fff'
            }}
          >
            {s.label}
          </button>
        ))}

        <div style={{ width: 1, background: 'var(--gris-200)', flexShrink: 0 }} />

        {/* Solo ofertas */}
        <button onClick={() => setFiltros({ soloOfertas: !soloOfertas })} style={chipStyle(soloOfertas)}>
          🏷️ Solo ofertas
        </button>

        {/* Separador */}
        {categorias.slice(0, 6).map(c => (
          <button key={c.categoria} onClick={() => setFiltros({ categoria: c.categoria === categoria ? '' : c.categoria })}
            style={chipStyle(categoria === c.categoria)}>
            {c.categoria}
          </button>
        ))}

        {hayFiltros && (
          <button onClick={resetFiltros} style={{
            ...chipStyle(false),
            color: 'var(--rojo)', borderColor: 'var(--rojo-claro)', background: 'var(--rojo-claro)'
          }}>
            × Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
