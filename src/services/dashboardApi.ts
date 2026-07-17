import api from '../config/api';

export type DashboardOverview = {
  revenueCoinsToday: number;
  revenueCoinsTodayNote?: string;
  revenueDailyBalance: number;
  revenueDailyBalanceNote?: string;
  rechargeCollectionTodayInr?: number;
  rechargeCollectionYesterdayInr?: number;
  rechargeDailySeries?: {
    points: Array<{
      date: string;
      rechargeInr: number;
      rechargeCoins: number;
      transactionCount: number;
    }>;
    timezone?: string;
    historyDays?: number;
    note?: string;
  };
  liveCallsProxy: number;
  activeUnsettledUserCalls: number;
  onlineHosts: number;
  hostsOnline?: number;
  hostsOnCall?: number;
  hostsOffline?: number;
  hostsTotal?: number;
  presenceNote?: string;
  totalAgencies: number;
  totalBds: number;
  pendingPayouts: number;
  pendingPayoutsNote?: string;
  totalCallMinutesToday: number;
  totalCallsToday: number;
  coinsSpentOnCallsToday: number;
  walletFlowSeries?: {
    points: Array<{
      date: string;
      rechargeInr?: number;
      rechargeCoins?: number;
      transactionCount?: number;
      creditCoins?: number;
      debitCoins?: number;
      netCoins?: number;
    }>;
    note?: string;
    selectedRange?: { from: string; to: string };
  };
  growthPlaceholder: { revenuePct: number | null; callsPct: number | null; hostsPct: number | null };
  selectedRange?: { from: string; to: string };
  metricContract?: Record<
    string,
    {
      label: string;
      backendField: string;
      scope: 'selected_range' | 'realtime';
      unit: string;
      definition: string;
    }
  >;
  generatedAt: string;
};

export type DashboardDateParams = {
  from?: string;
  to?: string;
};

function withDateParams(params?: DashboardDateParams, extra?: Record<string, unknown>) {
  return {
    ...(extra ?? {}),
    ...(params?.from ? { from: params.from } : {}),
    ...(params?.to ? { to: params.to } : {}),
  };
}

export type DashboardRazorpayBalance = {
  configured: boolean;
  fetchedAt: string;
  note?: string;
  fetchError?: string | null;
  totals: {
    currency: string;
    available: number;
    onHold: number;
    pending: number;
    reserved: number;
    settled: number;
    net: number;
  };
  hasNegativeAvailable: boolean;
  maxNegativeLimit: number;
  channels: Array<{
    key: string;
    channelLabel: string;
    currency: string;
    available: number;
    onHold: number;
    pending: number;
    reserved: number;
    settled: number;
    net: number;
    raw: Record<string, unknown>;
  }>;
  raw: unknown;
};

export type DashboardRazorpayCollectedAmount = {
  configured: true;
  amountSubunits: string | null;
  amountMajor: string | null;
  currency: string | null;
  paymentCount: number;
  currencyBuckets: Array<{
    currency: string;
    amountSubunits: string;
    amountMajor: string;
    paymentCount: number;
  }>;
  requestedRange: { from: string; to: string } | null;
  effectiveRange: { from: string | null; to: string };
  asOf: string;
  cache: 'miss' | 'hit' | 'stale';
  stale: boolean;
  dataMode: 'provider_scan' | 'projection';
  timestampBasis: 'payment_created_at';
  completeness: {
    complete: boolean;
    status: 'not_started' | 'pending' | 'running' | 'failed' | 'complete';
    backfillAsOf: string | null;
    completedAt: string | null;
    projectedPayments: number;
  };
  note: string;
};

export async function fetchDashboardOverview(params?: DashboardDateParams): Promise<DashboardOverview> {
  const res = await api.get('/admin/dashboard/overview', { params: withDateParams(params) });
  return res.data.data;
}

export async function fetchDashboardRevenue(days = 14, params?: DashboardDateParams) {
  const res = await api.get('/admin/dashboard/revenue', { params: withDateParams(params, { days }) });
  return res.data.data as {
    points: Array<{ date: string; revenueCoins: number; commissionCoins: number }>;
    note?: string;
  };
}

export async function fetchDashboardLiveCalls() {
  const res = await api.get('/admin/dashboard/live-calls');
  return res.data.data as {
    calls: Array<{
      callId: string;
      hostName: string;
      hostId: string | null;
      callerName: string;
      durationSeconds: number;
      revenueCoins: number;
      startedAt: string;
    }>;
    note?: string;
  };
}

export async function fetchDashboardRealtime() {
  const res = await api.get('/admin/dashboard/realtime');
  return res.data.data;
}

export async function fetchDashboardTopHosts(params?: DashboardDateParams) {
  const res = await api.get('/admin/dashboard/top-hosts', { params: withDateParams(params, { limit: 5 }) });
  return res.data.data as {
    rows: Array<{
      rank: number;
      host: string;
      creatorId: string;
      avatarUrl: string | null;
      minutes: number;
      calls: number;
      earningsCoins: number;
    }>;
    note?: string;
  };
}

export async function fetchDashboardTopBds(params?: DashboardDateParams) {
  const res = await api.get('/admin/dashboard/top-bds', { params: withDateParams(params, { limit: 5 }) });
  return res.data.data as {
    rows: Array<{
      rank: number;
      bdName: string;
      agencies: number;
      hosts: number;
      revenueCoins: number;
      commissionCoins: number;
    }>;
    note?: string;
  };
}

export async function fetchDashboardTopAgencies(params?: DashboardDateParams) {
  const res = await api.get('/admin/dashboard/top-agencies', { params: withDateParams(params, { limit: 5 }) });
  return res.data.data as {
    rows: Array<{
      rank: number;
      agencyName: string;
      bds: number;
      hosts: number;
      revenueCoins: number;
    }>;
    note?: string;
  };
}

export async function fetchDashboardAlerts() {
  const res = await api.get('/admin/dashboard/alerts');
  return res.data.data as {
    alerts: Array<{
      id: string;
      type: string;
      severity: 'info' | 'warning' | 'danger';
      message: string;
      createdAt: string;
    }>;
  };
}

export async function fetchDashboardHeatmap() {
  const res = await api.get('/admin/dashboard/heatmap');
  return res.data.data as {
    isDemo: boolean;
    cells: Array<{ day: number; hour: number; intensity: number }>;
    note?: string;
  };
}

export async function fetchDashboardCallAnalytics(params?: DashboardDateParams) {
  const res = await api.get('/admin/dashboard/call-analytics', { params: withDateParams(params) });
  return res.data.data as {
    today: {
      totalCalls: number;
      answeredCalls: number;
      missedCalls: number;
      avgCallDurationSec: number;
    };
    dailyVolume: Array<{ date: string; calls: number }>;
    selectedRange?: { from: string; to: string };
  };
}

export async function fetchDashboardPayouts(params?: DashboardDateParams) {
  const res = await api.get('/admin/dashboard/payouts', { params: withDateParams(params) });
  return res.data.data as {
    rows: Array<{
      id: string;
      userLabel: string;
      role: string;
      amount: number;
      requestedAt: string;
      status: string;
    }>;
    selectedRange?: { from: string; to: string };
  };
}

export async function fetchDashboardGeo() {
  const res = await api.get('/admin/dashboard/geo');
  return res.data.data as {
    isDemo: boolean;
    stats: {
      onlineHosts: number;
      liveCalls: number;
      callsPerMinute: number;
      revenuePerMinute: number;
    };
    topCountries: Array<{ code: string; label: string; pct: number }>;
    note?: string;
  };
}

export async function fetchDashboardRazorpayBalance(): Promise<DashboardRazorpayBalance> {
  const res = await api.get('/admin/dashboard/razorpay-balance');
  return res.data.data;
}

export async function fetchDashboardRazorpayCollectedAmount(
  params?: DashboardDateParams
): Promise<DashboardRazorpayCollectedAmount> {
  const res = await api.get('/admin/dashboard/razorpay-collected-amount', {
    params: withDateParams(params),
  });
  return res.data.data;
}

export type RechargeTransactionRow = {
  id: string;
  completedAt: string;
  completedAtIst: string;
  userId: string;
  userLabel: string;
  inr: number;
  coins: number;
  description: string | null;
  orderId: string | null;
  paymentId: string | null;
  transactionId: string;
};

export type RechargeTransactionsDay = {
  date: string;
  timezone: string;
  totalInr: number;
  totalCoins: number;
  transactionCount: number;
  transactions: RechargeTransactionRow[];
};

export async function fetchDashboardRechargeTransactions(date: string): Promise<RechargeTransactionsDay> {
  const res = await api.get('/admin/dashboard/recharge-transactions', { params: { date } });
  return res.data.data;
}
