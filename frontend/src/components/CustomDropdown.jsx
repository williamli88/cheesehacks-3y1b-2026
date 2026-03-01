import { useEffect, useRef } from 'react';
import './CustomDropdown.css';

export default function CustomDropdown({
  id,
  value,
  options,
  placeholder,
  openDropdown,
  setOpenDropdown,
  onChange,
  multiple = false
}) {
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
                key={`${id}-${option.value || 'empty'}`}
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
