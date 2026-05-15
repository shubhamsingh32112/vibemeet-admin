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
  creatorsOnlineToday?: Array<{ firebaseUid: string; displayName: string; onlineSeconds: number }>;
  creatorsOnlineTodayNote?: string;
  withdrawals?: {
    pendingCount: number;
    totalWithdrawn30d: number;
  };
  support?: {
    openTickets: number;
    highPriorityTickets: number;
  };
  generatedAt: string;
  selectedRange?: { from: string; to: string };
  rangeMetrics?: {
    users: { signups: number };
    coins: CoinFlow;
    calls: { totalCalls: number; totalDurationSec: number; totalCoinsSpent: number };
    withdrawals?: { totalCount: number; totalAmount: number };
    support?: { totalCount: number; highPriorityCount: number };
  };
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

export interface GalleryImageDto {
  id: string;
  url: string;
  storagePath: string;
  position: number;
  createdAt: string;
}

export interface CreatorPerformance {
  creatorId: string;
  userId: string;
  name: string;
  username: string | null;
  avatar: string | null;
  photo: string;
  categories: string[];
  price: number;
  isOnline: boolean;
  assignedAgencyId: string | null;
  assignedAgencyLabel: string | null;
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
  referredByUserId?: string | null;
  referralCodeUsed?: string | null;
  referrerLabel?: string | null;
  referrerIsAgency?: boolean;
}

export interface AdminAgencyBrief {
  id: string;
  email: string | null;
  displayName: string | null;
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

export interface WalletPricingPack {
  coins: number;
  tier1PriceInr: number;
  tier2PriceInr: number;
  oldPriceInr?: number;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface WalletPricingConfig {
  packages: WalletPricingPack[];
  defaults: WalletPricingPack[];
  updatedAt: string;
  updatedByAdminId: string | null;
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

export interface GlobalAppUpdatePayload {
  title: string;
  points: string[];
  updateUrl: string;
}

export interface GlobalAppUpdate {
  id: string;
  version: string;
  title: string;
  points: string[];
  updateUrl: string;
  isActive: boolean;
  publishedAt: string;
}

// ── Withdrawal Types ─────────────────────────────────────────────────────

export interface AdminWithdrawal {
  id: string;
  kind?: 'staff' | 'creator';
  staffUserId?: string | null;
  staffRole?: string | null;
  staffEmail?: string | null;
  staffDisplayName?: string | null;
  staffCurrentBalance?: number | null;
  creatorUserId: string;
  creatorName: string;
  creatorEmail: string | null;
  creatorPhone: string | null;
  creatorCurrentBalance: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: string;
  processedAt: string | null;
  adminUserId: string | null;
  notes: string | null;
  transactionId: string | null;
  createdAt: string;
  // Withdrawal details
  name: string | null;
  number: string | null;
  upi: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  assignedAgencyId?: string | null;
}

export interface WithdrawalSummary {
  pendingCount: number;
  totalWithdrawn30d: number;
  topWithdrawingCreators: {
    creatorUserId: string;
    name: string;
    email: string | null;
    totalWithdrawn: number;
    withdrawalCount: number;
  }[];
}

export interface WithdrawalsResponse {
  withdrawals: AdminWithdrawal[];
  summary: WithdrawalSummary;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ── Support Ticket Types ─────────────────────────────────────────────────

export interface AdminSupportTicket {
  id: string;
  userId: string;
  username: string;
  email: string | null;
  phone: string | null;
  userRole: string | null;
  role: 'user' | 'creator' | 'agency' | 'bd';
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAdminId: string | null;
  adminNotes: string | null;
  source?: 'chat' | 'post_call' | 'other' | 'staff_portal';
  relatedCallId?: string | null;
  reportedCreatorUserId?: string | null;
  reportedCreatorFirebaseUid?: string | null;
  reportedCreatorName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportSummary {
  openUserTickets: number;
  openCreatorTickets: number;
  openStaffTickets?: number;
  highPriorityOpen: number;
  unassigned: number;
  agingOver24h: number;
}

export interface SupportTicketsResponse {
  tickets: AdminSupportTicket[];
  summary: SupportSummary;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ── API Service ──────────────────────────────────────────────────────────

export const adminService = {
  // ── Overview ─────────────────────────────────────────
  getOverview: async (params?: { from?: string; to?: string }): Promise<OverviewData> => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await api.get(`/admin/overview${suffix}`);
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

  patchCreatorLinkedUser: async (
    creatorId: string,
    body: { username?: string; avatar?: string | null; categories?: string[] }
  ): Promise<{
    id: string;
    username?: string;
    avatar?: string;
    categories?: string[];
    profileRevision: number;
  }> => {
    const res = await api.patch(`/admin/creators/${creatorId}/user`, body);
    return res.data.data.user;
  },

  /**
   * Issue a Cloudflare-Images direct-upload session for an admin-driven
   * gallery upload. The admin uploads the bytes directly to Cloudflare,
   * then calls `creatorGalleryCommit` with the returned `sessionId`.
   */
  creatorGalleryUploadUrl: async (
    _creatorId: string,
    contentType: string,
    declaredSizeBytes: number,
  ): Promise<{ uploadUrl: string; sessionId: string; imageId: string; expiresAt: string }> => {
    const res = await api.post('/images/direct-upload', {
      purpose: 'creator-gallery',
      declaredSizeBytes,
      declaredMimeType: contentType,
    });
    return res.data.data;
  },

  creatorGalleryCommit: async (
    creatorId: string,
    sessionId: string,
  ): Promise<GalleryImageDto[]> => {
    const res = await api.post(`/admin/creators/${creatorId}/gallery/commit`, { sessionId });
    return res.data.data.galleryImages;
  },

  creatorGalleryDelete: async (creatorId: string, imageId: string): Promise<GalleryImageDto[]> => {
    const res = await api.delete(`/admin/creators/${creatorId}/gallery/${imageId}`);
    return res.data.data.galleryImages;
  },

  creatorGalleryReorder: async (creatorId: string, imageIds: string[]): Promise<GalleryImageDto[]> => {
    const res = await api.patch(`/admin/creators/${creatorId}/gallery/reorder`, { imageIds });
    return res.data.data.galleryImages;
  },

  // ── Users ────────────────────────────────────────────
  getUsersAnalytics: async (params?: {
    query?: string;
    role?: string;
    sort?: string;
    referrerAgencyId?: string;
    from?: string;
    to?: string;
  }): Promise<UserAnalytics[]> => {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append('query', params.query);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.referrerAgencyId) searchParams.append('referrerAgencyId', params.referrerAgencyId);
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    const res = await api.get(`/admin/users/analytics?${searchParams.toString()}`);
    return res.data.data.users;
  },

  listAgenciesBrief: async (): Promise<AdminAgencyBrief[]> => {
    const res = await api.get('/admin/agencies/brief');
    return res.data.data.agencies as AdminAgencyBrief[];
  },

  transferCreatorToAgency: async (
    creatorId: string,
    body: { targetAgencyId: string; reason: string }
  ): Promise<{
    creatorId: string;
    creatorUserId: string;
    oldAssignedAgencyId: string | null;
    newAssignedAgencyId: string;
    oldReferredByUserId: string | null;
    newReferredByUserId: string;
    oldReferralCodeUsed: string | null;
    newReferralCodeUsed: string;
    rewardMoved: boolean;
    pendingWithdrawalsReassigned: number;
  }> => {
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const res = await api.post(`/admin/creators/${creatorId}/transfer-agency`, body, {
      headers: { 'x-idempotency-key': idempotencyKey },
    });
    return res.data.data;
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
  getCoinEconomy: async (params?: { from?: string; to?: string }): Promise<CoinEconomy> => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await api.get(`/admin/coins${suffix}`);
    return res.data.data;
  },

  getWalletPricing: async (): Promise<WalletPricingConfig> => {
    const res = await api.get('/admin/wallet-pricing');
    return res.data.data;
  },

  updateWalletPricing: async (
    packages: WalletPricingPack[]
  ): Promise<{ packages: WalletPricingPack[]; updatedAt: string; updatedByAdminId: string | null }> => {
    const res = await api.put('/admin/wallet-pricing', { packages });
    return res.data.data;
  },

  // ── Calls ────────────────────────────────────────────
  getCalls: async (params?: {
    page?: number;
    limit?: number;
    anomaly?: boolean;
    from?: string;
    to?: string;
  }): Promise<{ calls: AdminCall[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.anomaly) searchParams.append('anomaly', 'true');
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
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

  getCurrentAppUpdate: async (): Promise<GlobalAppUpdate | null> => {
    const res = await api.get('/admin/app-updates/current');
    return res.data.data ?? null;
  },

  publishAppUpdate: async (
    payload: GlobalAppUpdatePayload
  ): Promise<GlobalAppUpdate> => {
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const res = await api.post('/admin/app-updates/publish', payload, {
      headers: {
        'x-idempotency-key': idempotencyKey,
      },
    });
    return res.data.data;
  },

  // ── Withdrawals ────────────────────────────────────
  getWithdrawals: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
    /** true = only agent-assigned; false = unassigned / no agent id */
    hasAssignedAgent?: boolean;
    /** staff = agency/BD wallet; creator = host payouts; all = default */
    type?: 'staff' | 'creator' | 'all';
    from?: string;
    to?: string;
  }): Promise<WithdrawalsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.hasAssignedAgent === true) searchParams.append('hasAssignedAgent', 'true');
    if (params?.hasAssignedAgent === false) searchParams.append('hasAssignedAgent', 'false');
    if (params?.type && params.type !== 'all') searchParams.append('type', params.type);
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    const res = await api.get(`/admin/withdrawals?${searchParams.toString()}`);
    return res.data.data;
  },

  approveWithdrawal: async (
    id: string,
    notes?: string
  ): Promise<{ withdrawalId: string; status: string; amount: number; transactionId: string }> => {
    const res = await api.post(`/admin/withdrawals/${id}/approve`, { notes });
    return res.data.data;
  },

  rejectWithdrawal: async (
    id: string,
    notes: string
  ): Promise<{ withdrawalId: string; status: string; amount: number; notes: string }> => {
    const res = await api.post(`/admin/withdrawals/${id}/reject`, { notes });
    return res.data.data;
  },

  markWithdrawalPaid: async (
    id: string,
    notes?: string
  ): Promise<{ withdrawalId: string; status: string; amount: number; processedAt: string }> => {
    const res = await api.post(`/admin/withdrawals/${id}/mark-paid`, { notes });
    return res.data.data;
  },

  // ── Support Tickets ────────────────────────────────
  getSupportTickets: async (params?: {
    role?: string;
    status?: string;
    priority?: string;
    source?: string;
    creatorReportsOnly?: boolean;
    staffPortalOnly?: boolean;
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<SupportTicketsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.source) searchParams.append('source', params.source);
    if (params?.creatorReportsOnly) searchParams.append('creatorReports', 'true');
    if (params?.staffPortalOnly) searchParams.append('staffPortal', 'true');
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    const res = await api.get(`/admin/support?${searchParams.toString()}`);
    return res.data.data;
  },

  updateTicketStatus: async (
    id: string,
    status: string,
    adminNotes?: string
  ): Promise<{ ticketId: string; oldStatus: string; newStatus: string }> => {
    const res = await api.patch(`/admin/support/${id}/status`, { status, adminNotes });
    return res.data.data;
  },

  getPlatformRevenue: async (): Promise<{ bdBps: number; agencyBps: number }> => {
    const res = await api.get('/admin/platform-revenue');
    return res.data.data;
  },

  updatePlatformRevenue: async (body: {
    bdBps: number;
    agencyBps: number;
  }): Promise<{ bdBps: number; agencyBps: number }> => {
    const res = await api.put('/admin/platform-revenue', body);
    return res.data.data;
  },
};
