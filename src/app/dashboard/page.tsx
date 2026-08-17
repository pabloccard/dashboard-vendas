'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardMetrics, DailyBreakdown, DatePreset, Product } from '@/types';
import { formatCurrency, formatPercentage, formatNumber, getDateRange } from '@/lib/utils';
import MetricCard from '@/components/MetricCard';
import DateFilter from '@/components/DateFilter';
import ProductFilter from '@/components/ProductFilter';
import AdAccountFilter from '@/components/AdAccountFilter';
import DailyTable from '@/components/DailyTable';

export default function DashboardPage() {
  const supabase = createClient();
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [daily, setDaily] = useState<DailyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase.auth]);

  // Fetch products and accounts
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

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    let from, to;
    if (datePreset === 'custom' && customDate) {
      from = customDate;
      to = customDate;
    } else {
      const range = getDateRange(datePreset);
      from = range.from;
      to = range.to;
    }

    const params = new URLSearchParams({
      date_from: from,
      date_to: to,
      user_id: userId,
    });

    if (selectedProducts.length > 0) {
      params.set('product_ids', selectedProducts.join(','));
    }
    if (selectedAdAccounts.length > 0) {
      params.set('ad_account_ids', selectedAdAccounts.join(','));
    }

    try {
      const response = await fetch(`/api/metrics?${params.toString()}`);
      const data = await response.json();

      if (data.metrics) setMetrics(data.metrics);
      if (data.daily) setDaily(data.daily);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, datePreset, customDate, selectedProducts, selectedAdAccounts]);

  // Sync with Facebook and then fetch metrics
  const syncAndFetch = useCallback(async (isManualSync = false) => {
    if (!userId) return;
    
    // Only show syncing spinner for manual sync, otherwise do it silently in background
    if (isManualSync) setSyncing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Call sync API
      await fetch('/api/sync/facebook', {
        method: 'POST',
        headers: {
          'x-user-token': session?.access_token || '',
        },
      });
      // After sync is done, refetch metrics to show new data
      await fetchMetrics();
    } catch (error) {
      console.error('Failed to sync:', error);
      // If sync fails, at least try to fetch metrics
      await fetchMetrics();
    } finally {
      if (isManualSync) setSyncing(false);
    }
  }, [userId, fetchMetrics, supabase.auth]);

  // Initial load: Fetch metrics immediately to show something, then sync in background
  useEffect(() => {
    if (userId) {
      fetchMetrics(); // Show fast
      syncAndFetch(); // Background sync
    }
  }, [userId, fetchMetrics, syncAndFetch]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="page-filters" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <DateFilter 
            selected={datePreset} 
            customDate={customDate}
            onChange={(preset, date) => {
              setDatePreset(preset);
              if (date) setCustomDate(date);
            }} 
          />
          <AdAccountFilter
            accounts={adAccounts}
            selectedIds={selectedAdAccounts}
            onChange={setSelectedAdAccounts}
          />
          <ProductFilter
            products={products}
            selectedIds={selectedProducts}
            onChange={setSelectedProducts}
          />
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => syncAndFetch(true)}
            disabled={syncing || loading}
            style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className={syncing ? "spin-animation" : ""}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.26l5.43 3.27" />
            </svg>
            {syncing ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            <MetricCard
              label="Faturamento Líquido"
              value={formatCurrency(metrics?.net_revenue || 0)}
              accent="primary"
              featured
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              }
              subtitle={`Bruto: ${formatCurrency(metrics?.gross_revenue || 0)}`}
            />

            <MetricCard
              label="Gasto com Anúncios"
              value={formatCurrency(metrics?.ad_spend || 0)}
              accent="red"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
                  <polyline points="17,6 23,6 23,12" />
                </svg>
              }
            />

            <MetricCard
              label="Lucro"
              value={formatCurrency(metrics?.profit || 0)}
              accent={(metrics?.profit || 0) >= 0 ? 'green' : 'red'}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              }
            />

            <MetricCard
              label="ROI"
              value={formatPercentage(metrics?.roi || 0)}
              accent={(metrics?.roi || 0) >= 0 ? 'green' : 'red'}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,16 12,12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              }
            />

            <MetricCard
              label="CPA"
              value={metrics?.approved_count ? formatCurrency(metrics?.cpa || 0) : '—'}
              accent="blue"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              }
              subtitle="Custo por aquisição"
            />

            <MetricCard
              label="Vendas Aprovadas"
              value={formatNumber(metrics?.approved_count || 0)}
              accent="green"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              }
            />

            <MetricCard
              label="Vendas Pendentes"
              value={formatNumber(metrics?.pending_count || 0)}
              accent="yellow"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              }
            />

            <MetricCard
              label="Reembolsos"
              value={formatNumber(metrics?.refunded_count || 0)}
              accent="red"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1,4 1,10 7,10" />
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                </svg>
              }
            />
          </div>

          <DailyTable data={daily} loading={loading} />
        </>
      )}
    </>
  );
}
