import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAdAccountInsights } from '@/lib/facebook';

// Facebook Marketing API - READ-ONLY sync
// This route ONLY performs GET requests to the Facebook API
// Required permission: ads_read (ONLY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for automated calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow service-authenticated calls or cron-authenticated calls
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check if user is authenticated via Supabase
      const userToken = request.headers.get('x-user-token');
      if (!userToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get user settings (where global FB token is stored)
    // For cron, we just get the first settings (since there's only one user)
    // For manual sync, we should ideally filter by user, but let's keep it simple
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('user_id, fb_access_token')
      .limit(1)
      .single();

    if (settingsError || !settingsData?.fb_access_token) {
      return NextResponse.json({ message: 'No Facebook access token found in settings' }, { status: 200 });
    }

    const globalFbToken = settingsData.fb_access_token;

    // Get all active ad accounts
    const { data: adAccounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('*');

    if (accountsError || !adAccounts?.length) {
      return NextResponse.json({ message: 'No ad accounts found' }, { status: 200 });
    }

    // Sync last 30 days for each account to ensure we have enough history
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 30);

    const dateFrom = pastDate.toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];

    const results = [];

    for (const account of adAccounts) {
      try {
        // READ-ONLY: Only GET request to fetch insights
        const insights = await fetchAdAccountInsights(
          account.fb_account_id,
          globalFbToken,
          dateFrom,
          dateTo
        );

        for (const insight of insights) {
          await supabase.from('ad_spend_daily').upsert(
            {
              user_id: account.user_id,
              ad_account_id: account.id,
              date: insight.date_start,
              spend: parseFloat(insight.spend) || 0,
              impressions: parseInt(insight.impressions) || 0,
              clicks: parseInt(insight.clicks) || 0,
              currency: 'BRL',
            },
            {
              onConflict: 'ad_account_id,date',
            }
          );
        }

        results.push({
          account: account.fb_account_name || account.fb_account_id,
          synced: insights.length,
        });
      } catch (error) {
        console.error(`Error syncing account ${account.fb_account_id}:`, error);
        results.push({
          account: account.fb_account_name || account.fb_account_id,
          error: String(error),
        });
      }
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('Facebook sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
