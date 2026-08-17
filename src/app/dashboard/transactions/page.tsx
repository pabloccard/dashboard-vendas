'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DatePreset, Product, Transaction } from '@/types';
import { formatCurrency, getDateRange } from '@/lib/utils';
import DateFilter from '@/components/DateFilter';
import ProductFilter from '@/components/ProductFilter';

export default function TransactionsPage() {
  const supabase = createClient();
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    if (!userId) return;
    supabase.from('products').select('*').eq('user_id', userId).order('name')
      .then(({ data }) => { if (data) setProducts(data); });
  }, [userId, supabase]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    let from, to;
    if (datePreset === 'custom' && customDate) {
      from = customDate; to = customDate;
    } else {
      const range = getDateRange(datePreset);
      from = range.from; to = range.to;
    }

    const params = new URLSearchParams({ date_from: from, date_to: to, user_id: userId });
    if (selectedProducts.length > 0) params.set('product_ids', selectedProducts.join(','));

    try {
      const res = await fetch(`/api/metrics?${params.toString()}`);
      const data = await res.json();
      if (data.transactions) setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, datePreset, customDate, selectedProducts]);

  useEffect(() => {
    if (userId) fetchTransactions();
  }, [userId, fetchTransactions]);

  const approved = transactions.filter(t => t.status === 'APPROVED');
  const totalNet = approved.reduce((s, t) => s + t.net_value_brl, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transações</h1>
          <p className="page-subtitle">{transactions.length} transações no período selecionado</p>
        </div>
        <div className="page-filters">
          <DateFilter selected={datePreset} customDate={customDate} onChange={(p, d) => { setDatePreset(p); if (d) setCustomDate(d); }} />
          <ProductFilter products={products} selectedIds={selectedProducts} onChange={setSelectedProducts} />
        </div>
      </div>

      {/* Summary bar */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-card-label">Total Transações</div>
          <div className="stat-card-value lime">{transactions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Aprovadas</div>
          <div className="stat-card-value green">{approved.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Receita Líquida</div>
          <div className="stat-card-value green">{formatCurrency(totalNet)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <span className="table-title">Todas as Vendas</span>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Produto</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Valor Líquido</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const d = new Date(tx.transaction_date);
                  const isApproved = tx.status === 'APPROVED';
                  const isPending = tx.status === 'PENDING';

                  return (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-2)' }}>
                        {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {tx.product?.name || 'Produto Desconhecido'}
                      </td>
                      <td>
                        <span className={`badge ${isApproved ? 'badge-green' : isPending ? 'badge-yellow' : 'badge-red'}`}>
                          {isApproved ? 'Aprovada' : isPending ? 'Pendente' : tx.status === 'REFUNDED' ? 'Reembolso' : tx.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isApproved ? 'var(--green)' : 'var(--text-3)' }}>
                        {isApproved ? '+' : ''}{formatCurrency(tx.net_value_brl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
