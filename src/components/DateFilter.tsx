'use client';

import { useState, useRef, useEffect } from 'react';
import { DatePreset } from '@/types';

type DateFilterProps = {
  selected: DatePreset;
  customDate?: string;
  onChange: (preset: DatePreset, customDate?: string) => void;
};

const presets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
];

export default function DateFilter({ selected, customDate, onChange }: DateFilterProps) {
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

  const getDisplayText = () => {
    if (selected === 'custom' && customDate) {
      const [y, m, d] = customDate.split('-');
      return `${d}/${m}/${y}`;
    }
    return presets.find(p => p.value === selected)?.label || 'Hoje';
  };

  return (
    <div className="product-filter" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        type="button"
        className="product-filter-select"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '160px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <span>{getDisplayText()}</span>
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
          marginTop: '4px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 50,
          minWidth: '200px'
        }}>
          {presets.map(preset => (
            <button
              key={preset.value}
              onClick={() => {
                onChange(preset.value);
                setIsOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                background: selected === preset.value ? 'var(--bg-input)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {preset.label}
            </button>
          ))}
          <div style={{ padding: '10px 12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Data Específica</label>
            <input 
              type="date" 
              className="form-input" 
              style={{ padding: '6px', fontSize: '13px', width: '100%' }}
              value={selected === 'custom' && customDate ? customDate : ''}
              onChange={(e) => {
                if (e.target.value) {
                  onChange('custom', e.target.value);
                  setIsOpen(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
