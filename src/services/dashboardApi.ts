import api from '../config/api';

export type DashboardOverview = {
  revenueCoinsToday: number;
  revenueCoinsTodayNote?: string;
  liveCallsProxy: number;
  activeUnsettledUserCalls: number;
  onlineHosts: number;
  totalAgencies: number;
  totalBds: number;
  pendingPayouts: number;
  totalCallMinutesToday: number;
  totalCallsToday: number;
  coinsSpentOnCallsToday: number;
  growthPlaceholder: { revenuePct: number | null; callsPct: number | null; hostsPct: number | null };
  generatedAt: string;
};

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

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const res = await api.get('/admin/dashboard/overview');
  return res.data.data;
}

export async function fetchDashboardRevenue(days = 14) {
  const res = await api.get('/admin/dashboard/revenue', { params: { days } });
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

export async function fetchDashboardTopHosts() {
  const res = await api.get('/admin/dashboard/top-hosts', { params: { limit: 5 } });
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
  };
}

export async function fetchDashboardTopBds() {
  const res = await api.get('/admin/dashboard/top-bds', { params: { limit: 5 } });
  return res.data.data as {
    rows: Array<{
      rank: number;
      bdName: string;
      hosts: number;
      revenueCoins: number;
      commissionCoins: number;
    }>;
  };
}

export async function fetchDashboardTopAgencies() {
  const res = await api.get('/admin/dashboard/top-agencies', { params: { limit: 5 } });
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

export async function fetchDashboardCallAnalytics() {
  const res = await api.get('/admin/dashboard/call-analytics');
  return res.data.data as {
    today: {
      totalCalls: number;
      answeredCalls: number;
      missedCalls: number;
      avgCallDurationSec: number;
    };
    dailyVolume: Array<{ date: string; calls: number }>;
  };
}

export async function fetchDashboardPayouts() {
  const res = await api.get('/admin/dashboard/payouts');
  return res.data.data as {
    rows: Array<{
      id: string;
      userLabel: string;
      role: string;
      amount: number;
      requestedAt: string;
      status: string;
    }>;
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
