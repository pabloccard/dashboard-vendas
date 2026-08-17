'use client';

import { AdAccount } from '@/types';
import MultiSelectFilter from './MultiSelectFilter';

type AdAccountFilterProps = {
  accounts: AdAccount[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
};

export default function AdAccountFilter({ accounts, selectedIds, onChange }: AdAccountFilterProps) {
  const options = accounts.map(a => ({ id: a.id, label: a.fb_account_name || `act_${a.fb_account_id}` }));
  
  return (
    <MultiSelectFilter
      options={options}
      selectedIds={selectedIds}
      onChange={onChange}
      placeholder="Todas as contas"
    />
  );
}
