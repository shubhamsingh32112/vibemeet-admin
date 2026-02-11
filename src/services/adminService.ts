import api from '../config/api';

// ── Types ────────────────────────────────────────────────────────────────

export interface OverviewData {
  users: {
    total: number;
    creators: number;
    admins: number;
    onlineCreators: number;
    recentSignups7d: number;
    onboarded: number;
    welcomeBonusClaimed: number;
    byRole: Record<string, number>;
  };
  coins: {
    totalInCirculation: number;
    today: CoinFlow;
    last7d: CoinFlow;
    last30d: CoinFlow;
    bySource30d: Record<string, { credited: number; debited: number }>;
  };
  calls: {
    totalAllTime: number;
    today: { totalCalls: number; totalDurationSec: number; totalCoinsSpent: number };
    last30d: {
      totalCalls: number;
      totalDurationMin: number;
      avgDurationSec: number;
      totalCoinsSpent: number;
      zeroDurationCalls: number;
      shortCalls: number;
      revenuePerMinute: number;
    };
  };
  chat: {
    totalChannels: number;
    totalFreeMessages: number;
    totalPaidMessages: number;
    exhaustedQuotas: number;
    freeToPayConversion: number;
  };
  generatedAt: string;
}

export interface CoinFlow {
  credited: number;
  creditCount: number;
  debited: number;
  debitCount: number;
  net: number;
}

export interface AbuseSignals {
  shortCallPct: number;
  zeroDuration30d: number;
  refundCount: number;
  refundRate: number;
  earnDeviation: number;
  isFlagged: boolean;
}

export interface CreatorPerformance {
  creatorId: string;
  userId: string;
  name: string;
  photo: string;
  categories: string[];
  price: number;
  isOnline: boolean;
  email: string | null;
  phone: string | null;
  coins: number;
  createdAt: string;
  totalCalls: number;
  totalMinutes: number;
  totalEarned: number;
  avgCallDurationSec: number;
  lastCallAt: string | null;
  calls30d: number;
  minutes30d: number;
  earned30d: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksClaimed: number;
  earningsPerMinute: number;
  abuseSignals: AbuseSignals;
}

export interface UserAnalytics {
  id: string;
  firebaseUid: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  avatar: string | null;
  gender: string | null;
  role: string;
  coins: number;
  welcomeBonusClaimed: boolean;
  categories: string[];
  isCreator: boolean;
  createdAt: string;
  totalSpent: number;
  totalCredited: number;
  transactionCount: number;
  callCount: number;
  totalCallMinutes: number;
  chatChannels: number;
  freeMessages: number;
  paidMessages: number;
}

export interface UserLedger {
  user: {
    id: string;
    firebaseUid: string;
    email: string | null;
    phone: string | null;
    username: string | null;
    avatar: string | null;
    gender: string | null;
    role: string;
    coins: number;
    welcomeBonusClaimed: boolean;
    categories: string[];
    usernameChangeCount: number;
    createdAt: string;
  };
  creator: {
    id: string;
    name: string;
    price: number;
    isOnline: boolean;
    categories: string[];
  } | null;
  transactions: LedgerTransaction[];
  calls: LedgerCall[];
  chatQuotas: { channelId: string; creatorFirebaseUid: string; freeMessagesSent: number; paidMessagesSent: number }[];
  summary: {
    totalCredited: number;
    totalDebited: number;
    expectedBalance: number;
    actualBalance: number;
    discrepancy: number;
  };
}

export interface LedgerTransaction {
  id: string;
  transactionId: string;
  type: 'credit' | 'debit';
  coins: number;
  source: string;
  description: string;
  callId?: string;
  status: string;
  createdAt: string;
}

export interface LedgerCall {
  callId: string;
  otherName: string;
  otherAvatar: string;
  ownerRole: string;
  durationSeconds: number;
  coinsDeducted: number;
  coinsEarned: number;
  createdAt: string;
}

export interface CoinEconomy {
  totalInCirculation: number;
  allTimeMinted: number;
  allTimeMintedCount: number;
  allTimeBurned: number;
  allTimeBurnedCount: number;
  topSpenders: TopActor[];
  topEarners: TopActor[];
  dailyFlow: DailyFlow[];
  recentLargeTransactions: LargeTransaction[];
  failedTransactions: FailedTransaction[];
}

export interface TopActor {
  userId: string;
  username: string | null;
  email: string | null;
  role: string;
  totalSpent?: number;
  totalEarned?: number;
  txCount: number;
}

export interface DailyFlow {
  date: string;
  credited: number;
  debited: number;
  creditCount: number;
  debitCount: number;
}

export interface LargeTransaction {
  id: string;
  transactionId: string;
  type: string;
  coins: number;
  source: string;
  description: string;
  status: string;
  user: { username: string; email: string; role: string } | null;
  createdAt: string;
}

export interface FailedTransaction {
  id: string;
  transactionId: string;
  type: string;
  coins: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface AdminCall {
  callId: string;
  ownerUserId: string;
  ownerUsername: string;
  otherUserId: string;
  otherName: string;
  otherUsername: string;
  ownerRole: string;
  durationSeconds: number;
  durationFormatted: string;
  coinsDeducted: number;
  coinsEarned: number;
  createdAt: string;
  isZeroDuration: boolean;
  isVeryShort: boolean;
  isSuspicious: boolean;
  isRefunded: boolean;
}

export interface RefundPreview {
  callId: string;
  canRefund: boolean;
  blockReason: string | null;
  call: {
    durationSeconds: number;
    coinsDeducted: number;
    createdAt: string;
    ageDays: number;
  };
  userImpact: {
    userId: string;
    username: string;
    currentBalance: number;
    afterRefund: number;
  } | null;
  creatorImpact: {
    userId: string;
    username: string;
    currentBalance: number;
    clawbackAmount: number;
    afterClawback: number;
  } | null;
}

export interface AdminActionLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface SystemHealth {
  services: Record<string, { status: string; latencyMs?: number; details?: string }>;
  platform: {
    onlineCreators: number;
    recentTransactions5m: number;
    recentCalls1h: number;
    failedTransactions1h: number;
    negativeBalanceUsers: number;
    balanceDiscrepancies: string;
  };
  serverTime: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

// ── API Service ──────────────────────────────────────────────────────────

export const adminService = {
  // ── Overview ─────────────────────────────────────────
  getOverview: async (): Promise<OverviewData> => {
    const res = await api.get('/admin/overview');
    return res.data.data;
  },

  // ── Creators ─────────────────────────────────────────
  getCreatorsPerformance: async (): Promise<CreatorPerformance[]> => {
    const res = await api.get('/admin/creators/performance');
    return res.data.data.creators;
  },

  forceCreatorOffline: async (creatorId: string): Promise<void> => {
    await api.post(`/admin/creators/${creatorId}/force-offline`);
  },

  // ── Users ────────────────────────────────────────────
  getUsersAnalytics: async (params?: {
    query?: string;
    role?: string;
    sort?: string;
  }): Promise<UserAnalytics[]> => {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append('query', params.query);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.sort) searchParams.append('sort', params.sort);
    const res = await api.get(`/admin/users/analytics?${searchParams.toString()}`);
    return res.data.data.users;
  },

  getUserLedger: async (userId: string): Promise<UserLedger> => {
    const res = await api.get(`/admin/users/${userId}/ledger`);
    return res.data.data;
  },

  adjustUserCoins: async (
    userId: string,
    amount: number,
    reason: string
  ): Promise<{ transactionId: string; oldBalance: number; newBalance: number }> => {
    const res = await api.post(`/admin/users/${userId}/adjust-coins`, {
      amount,
      reason,
    });
    return res.data.data;
  },

  // ── Coins ────────────────────────────────────────────
  getCoinEconomy: async (): Promise<CoinEconomy> => {
    const res = await api.get('/admin/coins');
    return res.data.data;
  },

  // ── Calls ────────────────────────────────────────────
  getCalls: async (params?: {
    page?: number;
    limit?: number;
    anomaly?: boolean;
  }): Promise<{ calls: AdminCall[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.anomaly) searchParams.append('anomaly', 'true');
    const res = await api.get(`/admin/calls?${searchParams.toString()}`);
    return res.data.data;
  },

  refundCall: async (
    callId: string,
    reason: string
  ): Promise<{
    callId: string;
    refundedAmount: number;
    userBalanceBefore: number;
    userBalanceAfter: number;
    creatorClawback: {
      creatorUserId: string;
      balanceBefore: number;
      balanceAfter: number;
    } | null;
  }> => {
    const res = await api.post(`/admin/calls/${callId}/refund`, { reason });
    return res.data.data;
  },

  getRefundPreview: async (callId: string): Promise<RefundPreview> => {
    const res = await api.get(`/admin/calls/${callId}/refund-preview`);
    return res.data.data;
  },

  // ── System Health ────────────────────────────────────
  getSystemHealth: async (): Promise<SystemHealth> => {
    const res = await api.get('/admin/system/health');
    return res.data.data;
  },

  // ── Admin Action Log ────────────────────────────────
  getActionLog: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AdminActionLogEntry[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const res = await api.get(`/admin/actions/log?${searchParams.toString()}`);
    return res.data.data;
  },
};
