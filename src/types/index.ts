export type Product = {
  id: string;
  user_id: string;
  hotmart_product_id: number;
  name: string;
  created_at: string;
};

export type AdAccount = {
  id: string;
  user_id: string;
  product_id: string | null;
  fb_account_id: string;
  fb_account_name: string | null;
  fb_access_token: string;
  created_at: string;
  product?: Product;
};

export type Transaction = {
  id: string;
  user_id: string;
  product_id: string | null;
  hotmart_transaction_id: string;
  event_type: string;
  status: string;
  gross_value: number;
  net_value: number;
  original_currency: string;
  exchange_rate: number;
  gross_value_brl: number;
  net_value_brl: number;
  payment_type: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  transaction_date: string;
  hotmart_event_id: string | null;
  created_at: string;
};

export type AdSpendDaily = {
  id: string;
  user_id: string;
  ad_account_id: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  currency: string;
  created_at: string;
};

export type Settings = {
  id: string;
  user_id: string;
  hotmart_hottok: string | null;
  fb_access_token: string | null;
  timezone: string;
  created_at: string;
};

export type DashboardMetrics = {
  gross_revenue: number;
  net_revenue: number;
  ad_spend: number;
  profit: number;
  roi: number;
  cpa: number;
  approved_count: number;
  pending_count: number;
  refunded_count: number;
};

export type DailyBreakdown = {
  date: string;
  gross_revenue: number;
  net_revenue: number;
  ad_spend: number;
  profit: number;
  roi: number;
  cpa: number;
  approved_count: number;
  pending_count: number;
  refunded_count: number;
};

export type DatePreset = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'custom';
