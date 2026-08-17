export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  if (!isFinite(value)) return '0,0%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value) + '%';
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today': {
      const from = today.toISOString().split('T')[0];
      return { from, to: from };
    }
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const d = yesterday.toISOString().split('T')[0];
      return { from: d, to: d };
    }
    case 'last_7_days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return {
        from: from.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
    }
    case 'last_30_days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return {
        from: from.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
    }
    default:
      return {
        from: today.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      };
  }
}

export function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
