'use client';

import { DailyBreakdown } from '@/types';
import { formatCurrency, formatPercentage, formatDateBR } from '@/lib/utils';

type DailyTableProps = {
  data: DailyBreakdown[];
  loading?: boolean;
};

export default function DailyTable({ data, loading }: DailyTableProps) {
  if (loading) {
    return (
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Detalhamento Diário</h3>
        </div>
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Detalhamento Diário</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">Nenhum dado encontrado para o período selecionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h3 className="table-title">Detalhamento Diário</h3>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Fat. Líquido</th>
              <th>Gasto Ads</th>
              <th>Lucro</th>
              <th>ROI</th>
              <th>CPA</th>
              <th>Aprovadas</th>
              <th>Pendentes</th>
              <th>Reembolsos</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.date}>
                <td className="td-neutral">{formatDateBR(row.date)}</td>
                <td className="td-positive">{formatCurrency(row.net_revenue)}</td>
                <td className="td-negative">{formatCurrency(row.ad_spend)}</td>
                <td className={row.profit >= 0 ? 'td-positive' : 'td-negative'}>
                  {formatCurrency(row.profit)}
                </td>
                <td className={row.roi >= 0 ? 'td-positive' : 'td-negative'}>
                  {formatPercentage(row.roi)}
                </td>
                <td className="td-neutral">
                  {row.approved_count > 0 ? formatCurrency(row.cpa) : '—'}
                </td>
                <td className="td-positive">{row.approved_count}</td>
                <td className="td-pending">{row.pending_count}</td>
                <td className="td-negative">{row.refunded_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
