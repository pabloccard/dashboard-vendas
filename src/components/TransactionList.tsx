'use client';

import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';

type TransactionListProps = {
  transactions: Transaction[];
};

export default function TransactionList({ transactions }: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Nenhuma venda registrada neste período.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 'var(--space-md)' }}>
      <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '16px', fontWeight: 600 }}>Lista de Vendas</h3>
      <div className="table-container">
        <table className="daily-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Data / Hora</th>
              <th style={{ textAlign: 'left' }}>Produto</th>
              <th style={{ textAlign: 'left' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Lucro (Líquido)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const dateObj = new Date(tx.transaction_date);
              const dateStr = dateObj.toLocaleDateString('pt-BR');
              const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <tr key={tx.id}>
                  <td>{dateStr} às {timeStr}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{(tx.product as any)?.name || 'Produto Removido'}</div>
                    {tx.buyer_name && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{tx.buyer_name}</div>}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: tx.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.1)' : 
                                     tx.status === 'PENDING' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: tx.status === 'APPROVED' ? '#22c55e' : 
                             tx.status === 'PENDING' ? '#eab308' : '#ef4444',
                    }}>
                      {tx.status === 'APPROVED' ? 'Aprovada' :
                       tx.status === 'PENDING' ? 'Pendente' :
                       tx.status === 'REFUNDED' ? 'Reembolso' : tx.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: tx.status === 'APPROVED' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                    {formatCurrency(tx.net_value_brl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
