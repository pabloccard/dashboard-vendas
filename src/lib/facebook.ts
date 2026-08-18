// Facebook Marketing API helper - READ-ONLY (ads_read permission only)
// This module ONLY performs GET requests to fetch ad insights.
// No write/update/delete operations are performed.

const FB_API_VERSION = 'v21.0';
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

export type FBInsight = {
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  clicks: string;
};

/**
 * Fetches daily ad spend insights for a given ad account.
 * READ-ONLY operation using GET /act_{id}/insights
 * Required permission: ads_read (ONLY)
 */
export async function fetchAdAccountInsights(
  adAccountId: string,
  accessToken: string,
  dateFrom: string,
  dateTo: string
): Promise<FBInsight[]> {
  const params = new URLSearchParams({
    level: 'account',
    time_increment: '1',
    fields: 'spend,impressions,clicks',
    'time_range[since]': dateFrom,
    'time_range[until]': dateTo,
    limit: '1000',
    access_token: accessToken,
  });

  const url = `${FB_GRAPH_URL}/act_${adAccountId}/insights?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    console.error('Facebook API error:', error);
    throw new Error(`Facebook API error: ${error?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}
