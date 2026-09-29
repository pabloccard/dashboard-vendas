'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardMetrics, DailyBreakdown, DatePreset, Product, Transaction, CountryStat } from '@/types';
import { formatCurrency, formatPercentage, formatNumber, getDateRange } from '@/lib/utils';
import DateFilter from '@/components/DateFilter';
import ProductFilter from '@/components/ProductFilter';
import AdAccountFilter from '@/components/AdAccountFilter';
import DailyTable from '@/components/DailyTable';
import MainChart from '@/components/MainChart';
import MiniChart from '@/components/MiniChart';
import CountryTable from '@/components/CountryTable';

export default function DashboardPage() {
  const supabase = createClient();
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<string[]>([]);
  
  // Applied filters for fetching
  const [appliedFilters, setAppliedFilters] = useState({
    datePreset: 'today' as DatePreset,
    customDate: '',
    selectedProducts: [] as string[],
    selectedAdAccounts: [] as string[],
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [daily, setDaily] = useState<DailyBreakdown[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
    const fetchDropdowns = async () => {
      const [productsRes, accountsRes] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', userId).order('name'),
        supabase.from('ad_accounts').select('*').eq('user_id', userId).order('fb_account_name')
      ]);
      if (productsRes.data) setProducts(productsRes.data);
      if (accountsRes.data) setAdAccounts(accountsRes.data);
    };
    fetchDropdowns();
  }, [userId, supabase]);

  const fetchMetrics = useCallback(async (filtersToUse = appliedFilters, showLoading = true) => {
    if (!userId) return;
    if (showLoading) setLoading(true);

    let from, to;
    if (filtersToUse.datePreset === 'custom' && filtersToUse.customDate) {
      from = filtersToUse.customDate; to = filtersToUse.customDate;
    } else {
      const range = getDateRange(filtersToUse.datePreset);
      from = range.from; to = range.to;
    }

    const params = new URLSearchParams({ date_from: from, date_to: to, user_id: userId });
    if (filtersToUse.selectedProducts.length > 0) params.set('product_ids', filtersToUse.selectedProducts.join(','));
    if (filtersToUse.selectedAdAccounts.length > 0) params.set('ad_account_ids', filtersToUse.selectedAdAccounts.join(','));

    try {
      const res = await fetch(`/api/metrics?${params.toString()}`);
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
      if (data.daily) setDaily(data.daily);
      if (data.transactions) setRecentTx(data.transactions);
      if (data.countryStats) setCountryStats(data.countryStats);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, appliedFilters]);

  const syncFacebook = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/sync/facebook', { method: 'POST', headers: { 'x-user-token': session?.access_token || '' } });
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }, [supabase.auth]);

  const syncAndFetch = useCallback(async (isManualSync = false, filtersToUse = appliedFilters) => {
    if (!userId) return;

    // Show data IMMEDIATELY with what's already in the database
    await fetchMetrics(filtersToUse);

    // Then sync Facebook in background and silently refresh
    if (isManualSync) setSyncing(true);
    try {
      await syncFacebook();
      // Silently refresh with updated ad spend data (no loading spinner)
      await fetchMetrics(filtersToUse, false);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      if (isManualSync) setSyncing(false);
    }
  }, [userId, fetchMetrics, syncFacebook, appliedFilters]);

  // Initial load
  useEffect(() => {
    if (userId) { 
      syncAndFetch(); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const profit = metrics?.profit || 0;
  const roi = metrics?.roi || 0;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Acompanhe suas métricas de vendas e anúncios</p>
        </div>
        <div className="page-filters">
          <DateFilter selected={datePreset} customDate={customDate} onChange={(p, d) => { setDatePreset(p); if (d) setCustomDate(d); }} />
          <AdAccountFilter accounts={adAccounts} selectedIds={selectedAdAccounts} onChange={setSelectedAdAccounts} />
          <ProductFilter products={products} selectedIds={selectedProducts} onChange={setSelectedProducts} />
          <button className="btn btn-secondary btn-sm" onClick={() => {
            const newFilters = { datePreset, customDate, selectedProducts, selectedAdAccounts };
            setAppliedFilters(newFilters);
            syncAndFetch(true, newFilters);
          }} disabled={syncing || loading} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={syncing ? 'spin-animation' : ''}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.26" />
            </svg>
            {syncing ? 'Sincronizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <>
          {/* ===== HERO SECTION ===== */}
          <div className="hero-grid">
            {/* Left — Big revenue card */}
            <div className="hero-card">
              <div>
                <div className="hero-card-label">
                  Faturamento Líquido
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="hero-card-value" style={{ margin: '16px 0 8px' }}>
                    {formatCurrency(metrics?.net_revenue || 0)}
                  </div>
                  {profit !== 0 && (
                    <span className={`hero-badge ${profit >= 0 ? 'positive' : 'negative'}`} style={{ marginTop: '8px' }}>
                      {profit > 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m7 7 10 10"/><path d="M17 7v10H7"/>
                        </svg>
                      )}
                      {profit > 0 ? '+' : ''}{formatCurrency(profit)}
                    </span>
                  )}
                </div>
              </div>
              <div className="hero-card-footer">
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  Bruto: {formatCurrency(metrics?.gross_revenue || 0)}
                </span>
              </div>
            </div>

            {/* Right — Two cards in the same row container */}
            <div className="side-cards-container">
              <div className="side-card accent-red">
                <div>
                  <span className="side-card-label">Gasto com Anúncios</span>
                  <div className="side-card-value" style={{ color: 'var(--red)' }}>
                    {formatCurrency(metrics?.ad_spend || 0)}
                  </div>
                </div>
                <MiniChart data={daily} dataKey="ad_spend" color="var(--red)" />
              </div>
              <div className={`side-card ${profit >= 0 ? 'accent-green' : 'accent-red'}`}>
                <div>
                  <span className="side-card-label">Lucro</span>
                  <div className="side-card-value" style={{ color: profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {formatCurrency(profit)}
                  </div>
                </div>
                <MiniChart data={daily} dataKey="profit" color={profit >= 0 ? 'var(--green)' : 'var(--red)'} />
              </div>
            </div>
          </div>

          {/* ===== STATS ROW ===== */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card-label">ROI</div>
              <div className={`stat-card-value ${roi >= 0 ? 'green' : 'red'}`}>
                {metrics?.ad_spend ? (metrics.net_revenue / metrics.ad_spend).toFixed(2) : '0.00'}x
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">CPA</div>
              <div className="stat-card-value blue">
                {metrics?.approved_count ? formatCurrency(metrics?.cpa || 0) : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Aprovadas</div>
              <div className="stat-card-value green">{formatNumber(metrics?.approved_count || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Pendentes</div>
              <div className="stat-card-value yellow">{formatNumber(metrics?.pending_count || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Reembolsos</div>
              <div className="stat-card-value red">{formatNumber(metrics?.refunded_count || 0)}</div>
            </div>
          </div>

          {/* ===== TWO COLUMNS ===== */}
          <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Left — Country Stats */}
            <CountryTable data={countryStats} loading={loading} />

            {/* Right — Recent activity */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Atividade Recente</span>
              </div>
              <div className="card-body">
                {recentTx.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p className="empty-state-text">Nenhuma transação neste período</p>
                  </div>
                ) : (
                  recentTx.map((tx) => {
                    const d = new Date(tx.transaction_date);
                    const isApproved = tx.status === 'APPROVED';
                    const isPending = tx.status === 'PENDING';
                    const statusClass = isApproved ? 'approved' : isPending ? 'pending' : 'refunded';
                    const statusIcon = isApproved ? '✓' : isPending ? '⏳' : '↩';

                    return (
                      <div className="activity-item" key={tx.id}>
                        <div className={`activity-dot ${statusClass}`}>{statusIcon}</div>
                        <div className="activity-info">
                          <div className="activity-name">{tx.product?.name || 'Produto'}</div>
                          <div className="activity-date">
                            {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="activity-value" style={{ color: isApproved ? 'var(--green)' : 'var(--text-3)' }}>
                          {isApproved ? '+' : ''}{formatCurrency(tx.net_value_brl)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <DailyTable data={daily} loading={loading} />
          </div>
        </>
      )}
    </>
  );
}
