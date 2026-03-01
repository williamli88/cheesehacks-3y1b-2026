import { useEffect, useRef, useState } from 'react';
import './Upload.css';
import { postItem, updateItem } from '../api';
import CustomDropdown from './CustomDropdown';

const GENDER_OPTIONS = [
  { value: 'MEN', label: 'Men' },
  { value: 'WOMEN', label: 'Women' }
];

const TYPE_OPTIONS = [
  { value: 'TOPS', label: 'Tops' },
  { value: 'BOTTOMS', label: 'Bottoms' },
  { value: 'OUTERWEAR', label: 'Outerwear' },
  { value: 'FOOTWEAR', label: 'Footwear' },
  { value: 'ACCESSORIES', label: 'Accessories' }
];

const SIZE_OPTIONS = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' }
];

const STYLE_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'STREET', label: 'Street' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'VINTAGE', label: 'Vintage' }
];

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' }
];

const COLOR_OPTIONS = ['black', 'white', 'blue', 'red', 'green', 'grey', 'brown', 'yellow', 'purple', 'pink']
  .map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));

export default function Upload({ user, onBack, initialItem = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState('');
  const [clothingType, setClothingType] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const [colors, setColors] = useState([]);
  const [style, setStyle] = useState('');
  const [imageData, setImageData] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState('');
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const fileInputRef = useRef(null);
  const isEditing = Boolean(initialItem && initialItem.id);

  useEffect(() => {
    if (!initialItem) return;
    setTitle(initialItem.title || '');
    setDescription(initialItem.description || '');
    setGender(initialItem.gender || '');
    setClothingType(initialItem.clothingType || initialItem.category || '');
    setSize(initialItem.size || '');
    setCondition(initialItem.condition || '');
    setStyle(initialItem.style || '');
    setColors((initialItem.colorTags || '').split(',').map((c) => c.trim()).filter(Boolean));
    setImageData(initialItem.imageUrl || '');
    setStatus('');
    setOpenDropdown(null);
  }, [initialItem]);

  const applyFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
    setStatus('');
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    applyFile(file);
    e.target.value = '';
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    applyFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasMissingCategory = !gender || !clothingType || !size || !condition || !style || colors.length === 0;
    if (hasMissingCategory) {
      setStatus('Please select all category fields');
      return;
    }
    setStatus(isEditing ? 'Saving...' : 'Uploading...');

    const item = {
      userId: user.userId || user.id,
      title,
      description,
      category: clothingType,
      gender,
      clothingType,
      size,
      condition,
      color: colors[0],
      style,
      colorTags: colors.join(','),
      styleTags: style.toLowerCase(),
      campus: user.campus,
      imageUrl: imageData
    };

    try {
      if (isEditing) {
        await updateItem(initialItem.id, item);
        setStatus('Updated');
      } else {
        await postItem(item);
        setStatus('Posted');
        setTitle('');
        setDescription('');
        setColors([]);
        setImageData('');
        setStyle('');
        setGender('');
        setClothingType('');
        setSize('');
        setCondition('');
        setOpenDropdown(null);
        setShowPostSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setStatus(isEditing ? 'Update failed' : 'Upload failed');
    }
  };

  const navigateBackToProfile = () => {
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
  };

  return (
    <div className="upload-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          className="back-btn"
          onClick={navigateBackToProfile}
          aria-label="Back"
          title="Back"
        >
          ←
        </button>
        <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Listing' : 'List an Item'}</h2>
      </div>

      <div
        className={`upload-dropzone ${isDragActive ? 'drag-active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop image or click to upload"
        onClick={openFilePicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="upload-file-input"
          onChange={handleFileInput}
        />

        {imageData ? (
          <>
            <img src={imageData} alt="Upload preview" className="upload-drop-preview" />
            <div className="upload-drop-overlay">Drop or tap to replace image</div>
          </>
        ) : (
          <div className="upload-drop-content">
            <div className="upload-drop-plus" aria-hidden="true">+</div>
            <p className="upload-drop-title">Drag & Drop Image</p>
            <p className="upload-drop-sub">or tap to browse files</p>
          </div>
        )}
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

        <div className="row">
          <CustomDropdown
            id="gender"
            value={gender}
            options={GENDER_OPTIONS}
            placeholder="Gender"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onChange={setGender}
          />
          <CustomDropdown
            id="type"
            value={clothingType}
            options={TYPE_OPTIONS}
            placeholder="Type"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onChange={setClothingType}
          />
        </div>

        <div className="row">
          <CustomDropdown
            id="size"
            value={size}
            options={SIZE_OPTIONS}
            placeholder="Size"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onChange={setSize}
          />
          <CustomDropdown
            id="style"
            value={style}
            options={STYLE_OPTIONS}
            placeholder="Style"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onChange={setStyle}
          />
          <CustomDropdown
            id="condition"
            value={condition}
            options={CONDITION_OPTIONS}
            placeholder="Condition"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onChange={setCondition}
          />
        </div>

        <CustomDropdown
          id="color"
          value={colors}
          options={COLOR_OPTIONS}
          placeholder="Color(s)"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          onChange={setColors}
          multiple
        />

        <button type="submit">{isEditing ? 'Save Changes' : 'Post'}</button>
      </form>
      <div
        className={`upload-status ${(status === 'Posted' || status === 'Updated') ? 'success' : ''} ${(status === 'Upload failed' || status === 'Update failed' || status.startsWith('Please select')) ? 'error' : ''}`}
      >
        {status}
      </div>

      {showPostSuccess && (
        <div className="upload-success-overlay" role="dialog" aria-modal="true" aria-live="polite">
          <div className="upload-success-card">
            <h3>Congratulations!</h3>
            <p>Your item was posted successfully.</p>
            <div className="upload-success-actions">
              <button
                type="button"
                className="upload-success-secondary"
                onClick={() => {
                  setShowPostSuccess(false);
                  setStatus('');
                }}
              >
                Continue Uploading
              </button>
              <button
                type="button"
                className="upload-success-primary"
                onClick={() => {
                  setShowPostSuccess(false);
                  setStatus('');
                  navigateBackToProfile();
                }}
              >
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
