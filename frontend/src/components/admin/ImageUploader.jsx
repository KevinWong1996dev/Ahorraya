import { useState, useRef } from 'react';

/**
 * ImageUploader — sube imágenes a Cloudinary gratis (sin backend)
 *
 * Setup en 2 minutos:
 * 1. Crea cuenta gratis en cloudinary.com
 * 2. Ve a Settings → Upload → Add upload preset
 *    - Signing mode: Unsigned
 *    - Folder: ahorraya-productos
 *    - Copia el nombre del preset
 * 3. Copia tu Cloud Name desde el Dashboard
 * 4. Pon ambos valores en frontend/.env:
 *    VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
 *    VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export default function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB'); return; }

    // Si no hay Cloudinary configurado, mostrar instrucciones
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError('Cloudinary no configurado. Ver instrucciones abajo o pega una URL directamente.');
      // Mostrar preview local mientras tanto
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      return;
    }

    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'ahorraya-productos');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        setPreview(data.secure_url);
        onChange(data.secure_url);
      } else {
        setError('Error al subir: ' + (data.error?.message || 'intenta de nuevo'));
      }
    } catch (err) {
      setError('Error de red al subir imagen');
    } finally { setUploading(false); }
  };

  const handleUrlChange = (url) => {
    setPreview(url);
    onChange(url);
  };

  return (
    <div>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.5px' }}>
        Imagen <span style={{ color:'#ef4444' }}>*</span>
      </label>

      {/* Área de drop / click */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#16a34a'; }}
        onDragLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#e2e8f0'; handleFile(e.dataTransfer.files[0]); }}
        style={{ border:'2px dashed #e2e8f0', borderRadius:10, padding:'1rem', textAlign:'center', cursor:'pointer', transition:'border-color 0.15s', marginBottom:8 }}>
        <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{ display:'none' }} />
        {uploading ? (
          <div style={{ color:'#64748b', fontSize:13 }}>⏳ Subiendo imagen...</div>
        ) : preview ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
            <img src={preview} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:8 }} onError={e=>e.target.style.display='none'} />
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#16a34a' }}>✓ Imagen lista</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>Clic para cambiar</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:28, marginBottom:4 }}>🖼️</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#475569' }}>Arrastra o haz clic para subir</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>JPG, PNG, WebP — máx 5MB</div>
          </div>
        )}
      </div>

      {/* O pegar URL directamente */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
        <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
        <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>o pega URL</span>
        <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
      </div>
      <input
        value={typeof value === 'string' && value.startsWith('http') ? value : ''}
        onChange={e => handleUrlChange(e.target.value)}
        placeholder="https://ejemplo.com/imagen.jpg"
        style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:13 }}
      />

      {error && <div style={{ marginTop:6, fontSize:12, color:'#ef4444' }}>{error}</div>}


    </div>
  );
}
