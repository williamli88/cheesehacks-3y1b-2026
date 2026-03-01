import { useState } from 'react';
import './Upload.css';
import { postItem } from '../api';

export default function Upload({ user, onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('T-SHIRT');
  const [size, setSize] = useState('M');
  const [condition, setCondition] = useState('GOOD');
  const [colorTags, setColorTags] = useState('');
  const [styleTags, setStyleTags] = useState('');
  const [imageData, setImageData] = useState('');
  const [status, setStatus] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Uploading...');

    const item = {
      userId: user.userId || user.id,
      title,
      description,
      category,
      size,
      condition,
      colorTags,
      styleTags,
      campus: user.campus,
      imageUrl: imageData
    };

    try {
      const res = await postItem(item);
      setStatus('Uploaded');
      setTitle(''); setDescription(''); setImageData(''); setColorTags(''); setStyleTags('');
    } catch (err) {
      console.error(err);
      setStatus('Upload failed');
    }
  };

  return (
    <div className="upload-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          className="back-btn"
          onClick={() => {
            console.debug('Upload back clicked, onBack present?', !!onBack, 'window.navigateTo?', !!window.navigateTo);
            // Primary: call the provided callback from App
            if (onBack) {
              try { onBack(); return; } catch (e) { console.warn('onBack threw', e); }
            }

            // Secondary: SPA-level global helper (added by App) — reliable when HMR
            // or prop wiring fails.
            if (window.navigateTo) {
              try { window.navigateTo('profile'); return; } catch (e) { console.warn('navigateTo failed', e); }
            }

            // Last-resort: browser history back (won't affect SPA state but may help
            // in some environments)
            try { window.history.back(); } catch (e) { /* ignore */ }
          }}
          aria-label="Back"
          title="Back"
        >
          ←
        </button>
        <h2 style={{ margin: 0 }}>List an Item</h2>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

        <div className="row">
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option>T-SHIRT</option>
            <option>JEANS</option>
            <option>JACKET</option>
            <option>DRESS</option>
            <option>SHOES</option>
            <option>SWEATER</option>
          </select>
          <select value={size} onChange={e => setSize(e.target.value)}>
            <option>XS</option>
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
          </select>
          <select value={condition} onChange={e => setCondition(e.target.value)}>
            <option>NEW</option>
            <option>GOOD</option>
            <option>FAIR</option>
          </select>
        </div>

        <input placeholder="Colors (comma separated)" value={colorTags} onChange={e => setColorTags(e.target.value)} />
        <input placeholder="Styles (comma separated)" value={styleTags} onChange={e => setStyleTags(e.target.value)} />

        <input type="file" accept="image/*" onChange={handleFile} />
        {imageData && <img src={imageData} alt="preview" className="preview" />}

        <button type="submit">Upload</button>
      </form>
      <div
        className={`upload-status ${status === 'Uploaded' ? 'success' : ''} ${status === 'Upload failed' ? 'error' : ''}`}
      >
        {status}
      </div>
    </div>
  );
}
