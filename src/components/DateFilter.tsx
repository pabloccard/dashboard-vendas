'use client';

import { DatePreset } from '@/types';

type DateFilterProps = {
  selected: DatePreset;
  onChange: (preset: DatePreset) => void;
};

const presets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7_days', label: '7 dias' },
  { value: 'last_30_days', label: '30 dias' },
];

export default function DateFilter({ selected, onChange }: DateFilterProps) {
  return (
    <div className="date-filter">
      {presets.map((preset) => (
        <button
          key={preset.value}
          className={`date-filter-btn ${selected === preset.value ? 'active' : ''}`}
          onClick={() => onChange(preset.value)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
