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
      <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '16px', fontWeight: 600 }}>Vendas Individuais</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {transactions.map((tx) => {
          const dateObj = new Date(tx.transaction_date);
          const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          const isApproved = tx.status === 'APPROVED';
          const isPending = tx.status === 'PENDING';

          return (
            <div 
              key={tx.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '12px 16px', 
                background: 'var(--bg-input)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                transition: 'transform 0.1s',
              }}
            >
              {/* Date & Time */}
              <div style={{ minWidth: '80px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{dateStr}</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{timeStr}</div>
              </div>

              {/* Product */}
              <div style={{ flex: 1, padding: '0 16px', overflow: 'hidden' }}>
                <div style={{ 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {(tx.product as any)?.name || 'Produto Desconhecido'}
                </div>
              </div>

              {/* Status */}
              <div style={{ minWidth: '100px', display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backgroundColor: isApproved ? 'rgba(34, 197, 94, 0.15)' : 
                                 isPending ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: isApproved ? '#22c55e' : 
                         isPending ? '#eab308' : '#ef4444',
                }}>
                  {isApproved ? 'Aprovada' :
                   isPending ? 'Pendente' :
                   tx.status === 'REFUNDED' ? 'Reembolso' : tx.status}
                </span>
              </div>

              {/* Net Value */}
              <div style={{ 
                minWidth: '100px', 
                textAlign: 'right', 
                fontWeight: 700, 
                fontSize: '15px',
                color: isApproved ? 'var(--accent-primary)' : 'var(--text-tertiary)' 
              }}>
                {isApproved ? '+' : ''}{formatCurrency(tx.net_value_brl)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
