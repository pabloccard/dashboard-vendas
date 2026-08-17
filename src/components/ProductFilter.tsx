'use client';

import { Product } from '@/types';

type ProductFilterProps = {
  products: Product[];
  selected: string | null;
  onChange: (productId: string | null) => void;
};

export default function ProductFilter({ products, selected, onChange }: ProductFilterProps) {
  return (
    <div className="product-filter">
      <select
        className="product-filter-select"
        value={selected || ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Todos os produtos</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
      <div className="product-filter-chevron">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>
    </div>
  );
}
