import { useEffect, useRef, useState } from 'react';
import './Upload.css';
import { postItem, updateItem } from '../api';

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

function CustomDropdown({ id, value, options, placeholder, openDropdown, setOpenDropdown, onChange, multiple = false }) {
  const isOpen = openDropdown === id;
  const rootRef = useRef(null);
  const selectedOption = multiple ? null : options.find((option) => option.value === value);
  const selectedValues = multiple && Array.isArray(value) ? value : [];
  const selectedLabels = multiple
    ? options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label)
    : [];
  const displayValue = multiple
    ? (selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder)
    : (selectedOption?.label || placeholder);
  const hasSelectedValue = multiple ? selectedLabels.length > 0 : Boolean(selectedOption);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!rootRef.current || rootRef.current.contains(event.target)) return;
      setOpenDropdown(null);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, setOpenDropdown]);

  return (
    <div className={`custom-select ${isOpen ? 'open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setOpenDropdown(isOpen ? null : id)}
      >
        <span className={`custom-select-value ${hasSelectedValue ? '' : 'placeholder'}`}>
          {displayValue}
        </span>
        <span className="custom-select-chevron" aria-hidden="true">▾</span>
      </button>

      {isOpen && (
        <div className="custom-select-menu" role="listbox" aria-label={id}>
          {options.map((option) => {
            const isSelected = multiple ? selectedValues.includes(option.value) : option.value === value;
            return (
              <button
                key={`${id}-${option.value}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (multiple) {
                    const next = selectedValues.includes(option.value)
                      ? selectedValues.filter((v) => v !== option.value)
                      : [...selectedValues, option.value];
                    onChange(next);
                    return;
                  }
                  onChange(option.value);
                  setOpenDropdown(null);
                }}
              >
                <span>{option.label}</span>
                {multiple && isSelected && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
        setStatus('Uploaded');
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
      }
    } catch (err) {
      console.error(err);
      setStatus(isEditing ? 'Update failed' : 'Upload failed');
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

        <button type="submit">{isEditing ? 'Save Changes' : 'Upload'}</button>
      </form>
      <div
        className={`upload-status ${(status === 'Uploaded' || status === 'Updated') ? 'success' : ''} ${(status === 'Upload failed' || status === 'Update failed' || status.startsWith('Please select')) ? 'error' : ''}`}
      >
        {status}
      </div>
    </div>
  );
}
