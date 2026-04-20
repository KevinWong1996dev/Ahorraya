import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store';
import { cartAPI } from '../services/api';

const SUP_COLORS = { supermaxi: '#E31837', megamaxi: '#C01028', aki: '#FF6B00', tia: '#00529B' };
const SUP_LABELS = { supermaxi: 'Supermaxi', megamaxi: 'Megamaxi', aki: 'Akí', tia: 'Tía' };
const SUP_EMOJI = { supermaxi: '🏪', megamaxi: '🏬', aki: '🛒', tia: '🛍️' };

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState('carrito'); // 'carrito' | 'resultado'

  const totalEstimado = items.reduce((a, i) => a + (parseFloat(i.min_precio) || 0) * i.cantidad, 0);

  const optimizar = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await cartAPI.optimize(
        items.map(i => ({ producto_id: i.id, cantidad: i.cantidad }))
      );
      setResultado(res.data);
      setVista('resultado');
    } catch (err) {
      alert('Error al calcular optimización. ¿Está el backend corriendo?');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && vista === 'carrito') {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>Tu carrito está vacío</h2>
        <p style={{ color: 'var(--gris-400)', marginBottom: 24 }}>Agrega productos desde la búsqueda para comparar precios</p>
        <button onClick={() => navigate('/')} style={{
          padding: '12px 28px', background: 'var(--verde)', color: '#fff',
          borderRadius: 10, fontSize: 16, fontWeight: 600
        }}>Buscar productos</button>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          {vista === 'carrito' ? '🛒 Mi carrito' : '💡 Resultado optimizado'}
        </h1>
        {vista === 'resultado' && (
          <button onClick={() => setVista('carrito')} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--gris-200)',
            fontSize: 14, color: 'var(--gris-600)', background: '#fff'
          }}>← Editar carrito</button>
        )}
      </div>

      {vista === 'carrito' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Lista de ítems */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)', overflow: 'hidden' }}>
            {items.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 1.25rem',
                borderBottom: i < items.length - 1 ? '1px solid var(--gris-100)' : 'none'
              }}>
                <div style={{ fontSize: 32 }}>{getCategoryEmoji(item.categoria)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--gris-400)' }}>
                    Desde ${Number(item.min_precio || 0).toFixed(2)} · {item.categoria}
                  </div>
                </div>
                {/* Cantidad */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateQty(item.id, item.cantidad - 1)} style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'var(--gris-100)', color: 'var(--gris-700)', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>−</button>
                  <span style={{ width: 24, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>{item.cantidad}</span>
                  <button onClick={() => updateQty(item.id, item.cantidad + 1)} style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'var(--gris-100)', color: 'var(--gris-700)', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>+</button>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--verde)', minWidth: 60, textAlign: 'right' }}>
                  ${(Number(item.min_precio || 0) * item.cantidad).toFixed(2)}
                </div>
                <button onClick={() => removeItem(item.id)} style={{
                  color: 'var(--gris-300)', background: 'none', fontSize: 18, padding: 4
                }}>×</button>
              </div>
            ))}
          </div>

          {/* Panel derecho */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)', padding: '1.5rem', position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 15, color: 'var(--gris-600)', marginBottom: 4 }}>{items.length} producto(s)</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--gris-900)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
              ≈ ${totalEstimado.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gris-400)', marginBottom: '1.5rem' }}>
              Estimado al precio más bajo disponible
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              borderRadius: 10, padding: '1rem', marginBottom: '1rem',
              border: '1px solid #86efac'
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--verde)', marginBottom: 4 }}>
                💡 Optimización inteligente
              </div>
              <div style={{ fontSize: 12, color: 'var(--gris-600)' }}>
                Calcula en cuál supermercado comprar cada producto para maximizar tu ahorro.
              </div>
            </div>

            <button onClick={optimizar} disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: 10,
              background: loading ? 'var(--gris-200)' : 'var(--verde)',
              color: loading ? 'var(--gris-400)' : '#fff',
              fontSize: 16, fontWeight: 700, marginBottom: 10,
              transition: 'background 0.2s'
            }}>
              {loading ? '⏳ Calculando...' : '⚡ Optimizar compra'}
            </button>

            <button onClick={clearCart} style={{
              width: '100%', padding: '9px', borderRadius: 10,
              background: 'none', color: 'var(--gris-400)', fontSize: 13,
              border: '1px solid var(--gris-200)'
            }}>Vaciar carrito</button>
          </div>
        </div>
      ) : resultado ? (
        /* Vista resultado */
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Resumen de ahorro */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12
          }}>
            {[
              { label: 'Ahorro potencial', value: `$${resultado.estrategia_optima?.ahorro_vs_mas_caro?.toFixed(2) || '0.00'}`, color: 'var(--verde)', icon: '💰' },
              { label: 'Total óptimo', value: `$${resultado.estrategia_optima?.total?.toFixed(2) || '0.00'}`, color: 'var(--azul)', icon: '🎯' },
              { label: 'Supermercados', value: resultado.estrategia_optima?.num_supermercados_necesarios || 1, color: 'var(--naranja)', icon: '🏪' }
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)',
                padding: '1.25rem', textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--gris-400)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Estrategia óptima por supermercado */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: '1rem' }}>📋 Plan de compra óptimo</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(resultado.estrategia_optima?.supermercados || {}).map(([sup, data]) => (
                <div key={sup} style={{
                  background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gris-200)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: `${SUP_COLORS[sup]}15`, padding: '12px 1.25rem',
                    borderBottom: '1px solid var(--gris-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{SUP_EMOJI[sup]}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: SUP_COLORS[sup] }}>{SUP_LABELS[sup]}</div>
                        <div style={{ fontSize: 12, color: 'var(--gris-500)' }}>{data.productos.length} producto(s)</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gris-900)', fontFamily: 'var(--font-display)' }}>
                      ${data.subtotal.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    {data.productos.map(prod => (
                      <div key={prod.producto_id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 1.25rem', borderBottom: '1px solid var(--gris-50)',
                        fontSize: 14
                      }}>
                        <div>
                          <span style={{ fontWeight: 500 }}>{prod.nombre}</span>
                          <span style={{ color: 'var(--gris-400)', marginLeft: 8 }}>×{prod.cantidad}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {prod.ahorro_vs_caro > 0 && (
                            <span style={{ fontSize: 11, color: 'var(--verde)', fontWeight: 600 }}>
                              ahorras ${prod.ahorro_vs_caro.toFixed(2)}
                            </span>
                          )}
                          <span style={{ fontWeight: 700, color: 'var(--gris-800)' }}>
                            ${prod.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* También: opción un solo supermercado */}
          {resultado.mejor_supermercado_unico && (
            <div style={{
              background: 'var(--azul-claro)', borderRadius: 'var(--radius-lg)',
              padding: '1.25rem', border: '1px solid #7dd3fc'
            }}>
              <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 4 }}>
                🏪 Si prefieres ir a un solo lugar...
              </div>
              <div style={{ fontSize: 15, color: 'var(--gris-700)' }}>
                <strong>{SUP_LABELS[resultado.mejor_supermercado_unico.supermercado]}</strong> es el más conveniente:
                {' '}
                <strong>${resultado.mejor_supermercado_unico.total.toFixed(2)}</strong> en total.
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function getCategoryEmoji(categoria) {
  const map = {
    'Lácteos': '🥛', 'Granos y Cereales': '🌾', 'Aceites y Condimentos': '🫙',
    'Azúcares y Endulzantes': '🍬', 'Panadería': '🍞', 'Huevos y Lácteos': '🥚',
    'Conservas': '🐟', 'Limpieza del Hogar': '🧹', 'Cuidado Personal': '🧴',
    'Bebidas': '🥤', 'Pastas y Fideos': '🍝', 'Condimentos': '🧂',
    'Higiene': '🧻', 'Carnes y Aves': '🍗', 'Frutas y Verduras': '🥦'
  };
  return map[categoria] || '🛒';
}
