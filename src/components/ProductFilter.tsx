'use client';

import { Product } from '@/types';
import MultiSelectFilter from './MultiSelectFilter';

type ProductFilterProps = {
  products: Product[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
};

export default function ProductFilter({ products, selectedIds, onChange }: ProductFilterProps) {
  const options = products.map(p => ({ id: p.id, label: p.name }));
  
  return (
    <MultiSelectFilter
      options={options}
      selectedIds={selectedIds}
      onChange={onChange}
      placeholder="Todos os produtos"
    />
  );
}
