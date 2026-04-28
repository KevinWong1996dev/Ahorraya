import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, contributionsAPI } from '../services/api';
import { useAuthStore } from '../store';

const SUPERMERCADOS = [
  { id: 'supermaxi', label: 'Mi Comisariato', color: '#E31837' },
  { id: 'megamaxi',  label: 'Mi Comisariato Plus',  color: '#C01028' },
  { id: 'aki',       label: 'Akí',       color: '#FF6B00' },
  { id: 'tia',       label: 'Tía',       color: '#00529B' }
];

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function getCatEmoji(c) {
  const m = {'Lácteos':'🥛','Granos y Cereales':'🌾','Aceites y Condimentos':'🫙','Azúcares y Endulzantes':'🍬','Panadería':'🍞','Huevos y Lácteos':'🥚','Conservas':'🐟','Limpieza del Hogar':'🧹','Cuidado Personal':'🧴','Bebidas':'🥤','Pastas y Fideos':'🍝','Condimentos':'🧂','Higiene':'🧻','Carnes y Aves':'🍗','Frutas y Verduras':'🥦','Snacks':'🍿'};
  return m[c] || '🛒';
}

async function uploadToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) return null;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'ahorraya-contribuciones');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:'POST', body:fd });
  const data = await res.json();
  return data.secure_url || null;
}

export default function Contribute() {
  const navigate  = useNavigate();
  const { token } = useAuthStore();

  const [step, setStep]             = useState(1);
  const [searchQ, setSearchQ]       = useState('');
  const [productos, setProductos]   = useState([]);
  const [selected, setSelected]     = useState(null);
  const [sup, setSup]               = useState('');
  const [precio, setPrecio]         = useState('');
  const [marca, setMarca]           = useState('');
  const [tamaño, setTamaño]         = useState('');
  const [unidad, setUnidad]           = useState('');
  const [foto, setFoto]             = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [uploading, setUploading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado]   = useState(null);
  const [error, setError]           = useState('');
  const debounceRef = useRef(null);
  const fotoRef     = useRef(null);

  if (!token) return (
    <div style={{ maxWidth:480, margin:'4rem auto', textAlign:'center' }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🔐</div>
      <h2 style={{ fontSize:22, marginBottom:8 }}>Inicia sesión para contribuir</h2>
      <p style={{ color:'var(--gris-400)', marginBottom:24, fontSize:15 }}>Necesitas una cuenta para registrar precios.</p>
      <button onClick={()=>navigate('/login')} style={{ padding:'12px 28px', background:'var(--verde)', color:'#fff', borderRadius:10, fontSize:16, fontWeight:700 }}>Iniciar sesión</button>
    </div>
  );

  const handleSearch = (val) => {
    setSearchQ(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setProductos([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await productsAPI.search({ q: val, limit: 8 });
      setProductos(res.data.data || []);
    }, 350);
  };

  const handleFoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Solo imágenes'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Máximo 10MB'); return; }
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async () => {
    if (!selected || !sup || !precio) { setError('Completa supermercado y precio'); return; }
    if (!foto && !fotoPreview) { setError('La foto del precio es obligatoria'); return; }
    setSubmitting(true); setError('');
    try {
      let foto_url = null;
      if (foto) {
        setUploading(true);
        foto_url = await uploadToCloudinary(foto);
        setUploading(false);
        // Sin Cloudinary: enviar igual, admin verá que no hay imagen pública
        if (!foto_url) foto_url = 'pendiente_de_subida';
      }
      const res = await contributionsAPI.create({
        producto_id: selected.id,
        precio:      parseFloat(precio),
        supermercado: sup,
        foto_url,
        // Campos extra en notas
        notas: [marca && `Marca: ${marca}`, tamaño && `Tamaño: ${tamaño}`, unidad && `Unidad: ${unidad}`].filter(Boolean).join(' | ') || undefined
      });
      setResultado(res.data); setStep(3);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al enviar');
    } finally { setSubmitting(false); setUploading(false); }
  };

  const reset = () => {
    setStep(1); setSearchQ(''); setProductos([]); setSelected(null);
    setSup(''); setPrecio(''); setMarca(''); setTamaño(''); setUnidad('');
    setFoto(null); setFotoPreview(''); setResultado(null); setError('');
  };

  // ── Renderizado ──────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:560, margin:'0 auto' }} className="animate-fade">
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontSize:28, fontWeight:800, marginBottom:6 }}>📝 Contribuir precio</h1>
        <p style={{ color:'var(--gris-500)', fontSize:15 }}>Reporta precios con foto. Se revisa antes de publicarse.</p>
      </div>

      {/* Beneficios */}
      {step === 1 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'2rem' }}>
          {[{e:'⭐',t:'+10 pts',d:'Por contribuir'},{e:'✅',t:'+5 pts',d:'Al aprobarse'},{e:'📷',t:'Foto obligatoria',d:'Para validar'}].map(b=>(
            <div key={b.t} style={{ background:'#fff', borderRadius:'var(--radius-lg)', border:'1px solid var(--gris-200)', padding:'1rem', textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:4 }}>{b.e}</div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--verde)' }}>{b.t}</div>
              <div style={{ fontSize:12, color:'var(--gris-400)', marginTop:2 }}>{b.d}</div>
            </div>
          ))}
        </div>
      )}

      {/* Indicador de pasos */}
      {step < 3 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1.5rem' }}>
          {[1,2].map(s=>(
            <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:step>=s?'var(--verde)':'var(--gris-100)', color:step>=s?'#fff':'var(--gris-400)', fontSize:13, fontWeight:700 }}>{s}</div>
              <span style={{ fontSize:13, color:step===s?'var(--gris-800)':'var(--gris-400)', fontWeight:step===s?600:400 }}>
                {s===1?'Seleccionar producto':'Precio + foto'}
              </span>
              {s<2 && <span style={{ color:'var(--gris-300)', fontSize:18 }}>›</span>}
            </div>
          ))}
        </div>
      )}

      {/* ── Paso 1: buscar producto ── */}
      {step===1 && (
        <div style={{ background:'#fff', borderRadius:'var(--radius-xl)', border:'1px solid var(--gris-200)', padding:'1.75rem' }}>
          <h2 style={{ fontSize:16, fontWeight:700, marginBottom:'1rem', color:'var(--gris-700)' }}>¿Qué producto viste?</h2>
          <input value={searchQ} onChange={e=>handleSearch(e.target.value)} placeholder="Busca por nombre, marca o categoría..."
            style={{ width:'100%', padding:'12px 16px', borderRadius:10, border:'2px solid var(--gris-200)', fontSize:15, marginBottom:8 }} />
          {productos.length>0 && (
            <div style={{ border:'1px solid var(--gris-200)', borderRadius:10, overflow:'hidden' }}>
              {productos.map((p,i)=>(
                <button key={p.id} onClick={()=>{ setSelected(p); setMarca(p.marca||''); setTamaño(p.peso_neto||''); setUnidad(p.unidad||''); setSearchQ(p.nombre); setProductos([]); setStep(2); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background:'none', textAlign:'left', cursor:'pointer', borderBottom:i<productos.length-1?'1px solid var(--gris-50)':'none' }}>
                  <span style={{ fontSize:26 }}>{getCatEmoji(p.categoria)}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color:'var(--gris-800)' }}>{p.nombre}</div>
                    <div style={{ fontSize:12, color:'var(--gris-400)' }}>
                      {[p.categoria, p.marca, p.peso_neto].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchQ.length>=2 && productos.length===0 && (
            <div style={{ padding:'1rem', background:'var(--gris-50)', borderRadius:10, textAlign:'center', color:'var(--gris-400)', fontSize:14 }}>Sin resultados</div>
          )}
        </div>
      )}

      {/* ── Paso 2: precio + foto + marca + tamaño ── */}
      {step===2 && selected && (
        <div style={{ background:'#fff', borderRadius:'var(--radius-xl)', border:'1px solid var(--gris-200)', padding:'1.75rem' }}>
          {/* Producto seleccionado */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--verde-claro)', borderRadius:10, marginBottom:'1.5rem' }}>
            <span style={{ fontSize:30 }}>{getCatEmoji(selected.categoria)}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{selected.nombre}</div>
              <div style={{ fontSize:12, color:'var(--verde)' }}>{[selected.categoria, selected.marca, selected.peso_neto].filter(Boolean).join(' · ')}</div>
            </div>
            <button onClick={()=>setStep(1)} style={{ color:'var(--gris-400)', background:'none', fontSize:20, border:'none', cursor:'pointer' }}>×</button>
          </div>

          {/* Supermercado */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={lblStyle}>¿En qué supermercado?</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              {SUPERMERCADOS.map(s=>(
                <button key={s.id} onClick={()=>setSup(s.id)} style={{ padding:'10px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', border:sup===s.id?`2px solid ${s.color}`:'1.5px solid var(--gris-200)', background:sup===s.id?`${s.color}12`:'#fff', color:sup===s.id?s.color:'var(--gris-600)', transition:'all 0.15s' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Precio */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={lblStyle}>Precio que viste <span style={{ color:'var(--rojo)' }}>*</span></label>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontWeight:700, fontSize:20, color:'var(--gris-400)' }}>$</span>
              <input type="number" step="0.01" min="0.01" value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="0.00"
                style={{ width:'100%', padding:'13px 14px 13px 34px', borderRadius:10, border:'2px solid var(--gris-200)', fontSize:22, fontWeight:700 }} />
            </div>
          </div>

          {/* Marca, Tamaño, Unidad */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:'1.25rem' }}>
            <div>
              <label style={lblStyle}>Marca</label>
              <input value={marca} onChange={e=>setMarca(e.target.value)} placeholder={selected.marca||'Ej: Nestlé'}
                style={{ width:'100%', padding:'10px 10px', borderRadius:10, border:'1.5px solid var(--gris-200)', fontSize:13 }} />
            </div>
            <div>
              <label style={lblStyle}>Tamaño</label>
              <input value={tamaño} onChange={e=>setTamaño(e.target.value)} placeholder={selected.peso_neto||'Ej: 200ml'}
                style={{ width:'100%', padding:'10px 10px', borderRadius:10, border:'1.5px solid var(--gris-200)', fontSize:13 }} />
            </div>
            <div>
              <label style={lblStyle}>Unidad</label>
              <select value={unidad} onChange={e=>setUnidad(e.target.value)}
                style={{ width:'100%', padding:'10px 10px', borderRadius:10, border:'1.5px solid var(--gris-200)', fontSize:13, background:'#fff' }}>
                <option value="">—</option>
                {['L','ml','kg','g','unidad','pack','rollo','caja','funda','tarro','botella','bolsa'].map(u=>(
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Foto OBLIGATORIA */}
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={lblStyle}>
              📷 Foto del precio en el supermercado <span style={{ color:'var(--rojo)' }}>* obligatoria</span>
            </label>
            <div style={{ fontSize:12, color:'var(--gris-400)', marginBottom:8 }}>
              Toma una foto clara de la etiqueta de precio. Se usará para validar tu contribución.
            </div>

            <input ref={fotoRef} type="file" accept="image/*" capture="environment"
              onChange={e=>handleFoto(e.target.files[0])} style={{ display:'none' }} />

            {fotoPreview ? (
              <div style={{ position:'relative' }}>
                <img src={fotoPreview} alt="evidencia" style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:10, border:'2px solid var(--verde)', display:'block' }} />
                <button onClick={()=>{ setFoto(null); setFotoPreview(''); }}
                  style={{ position:'absolute', top:8, right:8, width:30, height:30, borderRadius:'50%', background:'rgba(0,0,0,0.65)', color:'#fff', border:'none', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(22,163,74,0.9)', color:'#fff', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99 }}>✓ Foto lista</div>
              </div>
            ) : (
              <div onClick={()=>fotoRef.current?.click()}
                style={{ border:'2px dashed var(--gris-200)', borderRadius:10, padding:'2rem', textAlign:'center', cursor:'pointer', background:'var(--gris-50)', transition:'border-color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--verde)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--gris-200)'}>
                <div style={{ fontSize:40, marginBottom:8 }}>📷</div>
                <div style={{ fontWeight:600, fontSize:14, color:'var(--gris-700)', marginBottom:4 }}>Toca para tomar foto o subir imagen</div>
                <div style={{ fontSize:12, color:'var(--gris-400)' }}>JPG, PNG — máx 10MB</div>
              </div>
            )}
          </div>



          {error && (
            <div style={{ background:'var(--rojo-claro)', color:'var(--rojo)', borderRadius:8, padding:'10px 14px', fontSize:14, marginBottom:'1rem' }}>{error}</div>
          )}

          <button onClick={handleSubmit} disabled={submitting || !sup || !precio || (!foto && !fotoPreview)}
            style={{ width:'100%', padding:'14px', borderRadius:10, background:(submitting||!sup||!precio||(!foto&&!fotoPreview))?'var(--gris-200)':'var(--verde)', color:(submitting||!sup||!precio||(!foto&&!fotoPreview))?'var(--gris-400)':'#fff', fontSize:16, fontWeight:700, border:'none', cursor:'pointer' }}>
            {uploading?'⏳ Subiendo foto...' : submitting?'⏳ Enviando...' : '✅ Enviar para revisión'}
          </button>
          <div style={{ marginTop:8, fontSize:12, color:'var(--gris-400)', textAlign:'center' }}>
            Será revisado por el equipo antes de publicarse
          </div>
        </div>
      )}

      {/* ── Paso 3: éxito ── */}
      {step===3 && resultado && (
        <div style={{ background:'#fff', borderRadius:'var(--radius-xl)', border:'1px solid var(--gris-200)', padding:'2.5rem', textAlign:'center' }} className="animate-fade">
          <div style={{ fontSize:64, marginBottom:16 }}>⏳</div>
          <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>¡Enviado!</h2>
          <p style={{ color:'var(--gris-500)', marginBottom:'1rem' }}>Tu contribución está pendiente de revisión.</p>
          <div style={{ background:'var(--gris-50)', borderRadius:10, padding:'1rem', marginBottom:'2rem', fontSize:14, color:'var(--gris-600)', lineHeight:1.6 }}>
            Al aprobarse recibirás una notificación y <strong>+5 puntos</strong> extra.
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={reset} style={{ padding:'11px 24px', background:'var(--verde)', color:'#fff', borderRadius:10, fontSize:15, fontWeight:700, border:'none', cursor:'pointer' }}>Otro precio</button>
            <button onClick={()=>navigate('/perfil')} style={{ padding:'11px 24px', background:'var(--gris-100)', color:'var(--gris-700)', borderRadius:10, fontSize:15, fontWeight:600, border:'none', cursor:'pointer' }}>Ver perfil</button>
          </div>
        </div>
      )}
    </div>
  );
}

const lblStyle = { display:'block', fontWeight:600, fontSize:14, marginBottom:6, color:'var(--gris-700)' };
