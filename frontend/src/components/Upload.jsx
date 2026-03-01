import { useState } from 'react';
import './Upload.css';
import { postItem } from '../api';

const COLOR_OPTIONS = ['black', 'white', 'blue', 'red', 'green', 'grey', 'brown', 'yellow', 'purple', 'pink'];

export default function Upload({ user, onBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState('MEN');
  const [clothingType, setClothingType] = useState('TOPS');
  const [size, setSize] = useState('M');
  const [condition, setCondition] = useState('GOOD');
  const [color, setColor] = useState('');
  const [style, setStyle] = useState('ACTIVE');
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
      category: clothingType,
      gender,
      clothingType,
      size,
      condition,
      color,
      style,
      colorTags: color,
      styleTags: style.toLowerCase(),
      campus: user.campus,
      imageUrl: imageData
    };

    try {
      const res = await postItem(item);
      setStatus('Uploaded');
      setTitle('');
      setDescription('');
      setColor('');
      setImageData('');
      setStyle('ACTIVE');
      setGender('MEN');
      setClothingType('TOPS');
      setSize('M');
      setCondition('GOOD');
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
          <select value={gender} onChange={e => setGender(e.target.value)} required>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </select>
          <select value={clothingType} onChange={e => setClothingType(e.target.value)} required>
            <option value="TOPS">Tops</option>
            <option value="BOTTOMS">Bottoms</option>
            <option value="OUTERWEAR">Outerwear</option>
            <option value="FOOTWEAR">Footwear</option>
            <option value="ACCESSORIES">Accessories</option>
          </select>
        </div>

        <div className="row">
          <select value={size} onChange={e => setSize(e.target.value)} required>
            <option>XS</option>
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
          </select>
          <select value={style} onChange={e => setStyle(e.target.value)} required>
            <option value="ACTIVE">active</option>
            <option value="STREET">street</option>
            <option value="FORMAL">formal</option>
            <option value="VINTAGE">vintage</option>
          </select>
          <select value={condition} onChange={e => setCondition(e.target.value)} required>
            <option>NEW</option>
            <option>GOOD</option>
            <option>FAIR</option>
          </select>
        </div>

        <select value={color} onChange={e => setColor(e.target.value)} required>
          <option value="" disabled>Select color</option>
          {COLOR_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>

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
