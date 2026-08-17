'use client';

import { useState, useRef, useEffect } from 'react';

type Option = {
  id: string;
  label: string;
};

type MultiSelectFilterProps = {
  options: Option[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder: string;
};

export default function MultiSelectFilter({ options, selectedIds, onChange, placeholder }: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(item => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const getDisplayText = () => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length === 1) {
      return options.find(o => o.id === selectedIds[0])?.label || placeholder;
    }
    return `${selectedIds.length} selecionados`;
  };

  return (
    <div className="product-filter" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        type="button"
        className="product-filter-select"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getDisplayText()}
        </span>
        <div className="product-filter-chevron" style={{ position: 'static', transform: 'none', marginLeft: '8px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 50,
          maxHeight: '250px',
          overflowY: 'auto'
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '8px 12px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              Nenhuma opção disponível
            </div>
          ) : (
            options.map(option => (
              <label key={option.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                background: selectedIds.includes(option.id) ? 'var(--bg-input)' : 'transparent',
              }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => toggleOption(option.id)}
                  style={{ marginRight: '10px', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {option.label}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
