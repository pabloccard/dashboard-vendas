import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const productIdsStr = searchParams.get('product_ids');
    const adAccountIdsStr = searchParams.get('ad_account_ids');
    const userId = searchParams.get('user_id');

    if (!dateFrom || !dateTo || !userId) {
      return NextResponse.json(
        { error: 'Missing required params: date_from, date_to, user_id' },
        { status: 400 }
      );
    }

    // Build date range for transactions (using timestamptz)
    const dateFromStart = `${dateFrom}T00:00:00-03:00`;
    const dateToEnd = `${dateTo}T23:59:59-03:00`;

    // ===== TRANSACTIONS QUERY =====
    let txQuery = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', dateFromStart)
      .lte('transaction_date', dateToEnd);

    const productIds = productIdsStr ? productIdsStr.split(',').filter(Boolean) : [];
    const adAccountIds = adAccountIdsStr ? adAccountIdsStr.split(',').filter(Boolean) : [];

    if (productIds.length > 0) {
      txQuery = txQuery.in('product_id', productIds);
    }

    const { data: transactions, error: txError } = await txQuery;

    if (txError) {
      console.error('Transactions query error:', txError);
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    // ===== AD SPEND QUERY =====
    let adQuery = supabase
      .from('ad_spend_daily')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateFrom)
      .lte('date', dateTo);

    if (adAccountIds.length > 0) {
      adQuery = adQuery.in('ad_account_id', adAccountIds);
    }

    const { data: adSpend, error: adError } = await adQuery;

    if (adError) {
      console.error('Ad spend query error:', adError);
      // Non-fatal: continue without ad data
    }

    // ===== AGGREGATE METRICS =====
    const approvedTx = (transactions || []).filter((t) => t.status === 'APPROVED');
    const pendingTx = (transactions || []).filter(
      (t) => t.status === 'PENDING'
    );
    const refundedTx = (transactions || []).filter(
      (t) => t.status === 'REFUNDED' || t.status === 'CHARGEBACK'
    );

    const grossRevenue = approvedTx.reduce((sum, t) => sum + Number(t.gross_value_brl), 0);
    const netRevenue = approvedTx.reduce((sum, t) => sum + Number(t.net_value_brl), 0);
    const totalAdSpend = (adSpend || []).reduce((sum, a) => sum + Number(a.spend), 0);
    const profit = netRevenue - totalAdSpend;
    const roi = totalAdSpend > 0 ? ((netRevenue - totalAdSpend) / totalAdSpend) * 100 : 0;
    const cpa = approvedTx.length > 0 ? totalAdSpend / approvedTx.length : 0;

    const metrics = {
      gross_revenue: grossRevenue,
      net_revenue: netRevenue,
      ad_spend: totalAdSpend,
      profit,
      roi,
      cpa,
      approved_count: approvedTx.length,
      pending_count: pendingTx.length,
      refunded_count: refundedTx.length,
    };

    // ===== DAILY BREAKDOWN =====
    const dailyMap = new Map<string, {
      gross_revenue: number;
      net_revenue: number;
      ad_spend: number;
      approved_count: number;
      pending_count: number;
      refunded_count: number;
    }>();

    // Initialize all days in range
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, {
        gross_revenue: 0,
        net_revenue: 0,
        ad_spend: 0,
        approved_count: 0,
        pending_count: 0,
        refunded_count: 0,
      });
    }

    // Populate with transactions
    for (const tx of transactions || []) {
      const day = new Date(tx.transaction_date).toISOString().split('T')[0];
      const entry = dailyMap.get(day);
      if (!entry) continue;

      if (tx.status === 'APPROVED') {
        entry.gross_revenue += Number(tx.gross_value_brl);
        entry.net_revenue += Number(tx.net_value_brl);
        entry.approved_count += 1;
      } else if (tx.status === 'PENDING') {
        entry.pending_count += 1;
      } else if (tx.status === 'REFUNDED' || tx.status === 'CHARGEBACK') {
        entry.refunded_count += 1;
      }
    }

    // Populate with ad spend
    for (const ad of adSpend || []) {
      const entry = dailyMap.get(ad.date);
      if (!entry) continue;
      entry.ad_spend += Number(ad.spend);
    }

    // Build daily breakdown array
    const daily = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        gross_revenue: d.gross_revenue,
        net_revenue: d.net_revenue,
        ad_spend: d.ad_spend,
        profit: d.net_revenue - d.ad_spend,
        roi: d.ad_spend > 0 ? ((d.net_revenue - d.ad_spend) / d.ad_spend) * 100 : 0,
        cpa: d.approved_count > 0 ? d.ad_spend / d.approved_count : 0,
        approved_count: d.approved_count,
        pending_count: d.pending_count,
        refunded_count: d.refunded_count,
      }))
      .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

    return NextResponse.json({ metrics, daily }, { status: 200 });
  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
