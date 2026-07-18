import api from '../config/api';
import { parseDirectUploadPayload } from '../utils/cloudflareImageUpload';

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
  storagePath?: string;
  position: number;
  createdAt: string;
  /** Nested shape from some API paths before staff DTO mapping. */
  image?: {
    galleryUrls?: {
      thumb?: string;
      md?: string;
      xl?: string;
    };
  };
}

export interface CreatorPerformance {
  creatorId: string;
  userId: string;
  name: string;
  username: string | null;
  avatar?: import('../types/hostProfile').HostAvatarDto | null;
  avatarUrl?: string | null;
  photo?: string | null;
  galleryCount?: number;
  categories: string[];
  price: number;
  isOnline: boolean;
  isDisabled?: boolean;
  presenceStatus?: 'online' | 'on_call' | 'offline';
  presenceUpdatedAt?: string | null;
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
  /** Historical average — same as creator `avgEarningsPerMinute` */
  avgEarningsPerMinute: number;
  /** Current rate — same as creator `earningsPerMinute` */
  currentEarningsPerMinute: number;
  /** @deprecated Use avgEarningsPerMinute */
  earningsPerMinute: number;
  /** Seconds available online in current daily period (23:59 reset); matches creator home. */
  onlineTodaySeconds?: number;
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
  loginCount?: number;
  latestLoginAt?: string | null;
  interactiveLoginCount?: number;
  sessionRestoreCount?: number;
}

export type WebsiteAudienceCategory =
  | 'created_on_website'
  | 'preexisting_then_website';

export interface WebsiteUser {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  avatar: unknown;
  coins: number;
  accountCreatedAt: string;
  websiteAudienceCategory: WebsiteAudienceCategory;
  websiteAudienceSince: string;
  firstWebsiteLoginAt: string | null;
  lastWebsiteLoginAt: string | null;
}

export interface AttributionCoverageMeta {
  trackingStart: string;
  coverage: string;
  timezone: string;
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
  /** Creator-side settlement — matches creator wallet call rows */
  creatorCoinsEarned: number;
  callStartedAt?: string | null;
  callEndedAt?: string | null;
  settledAt?: string | null;
  billingStatus?: string;
  createdAt: string;
  isZeroDuration: boolean;
  isVeryShort: boolean;
  isSuspicious: boolean;
  isRefunded: boolean;
  canRetrySettlement?: boolean;
  settlementIssue?:
    | 'zero_duration_with_billing'
    | 'unsettled_ledger'
    | 'failed_recovery'
    | 'stuck_settling'
    | null;
  authoritativeCoinsDeducted?: number | null;
}

export interface SettlementRetryPreview {
  callId: string;
  eligible: boolean;
  skipReason?: string;
  settlementIssue:
    | 'zero_duration_with_billing'
    | 'unsettled_ledger'
    | 'failed_recovery'
    | 'stuck_settling'
    | null;
  billingStatus: string;
  callHistory: {
    durationSeconds: number;
    coinsDeducted: number;
    walletCoinsDeducted?: number | null;
    coinsEarned: number;
    settlementStatus?: string;
  } | null;
  authoritativeTotals: {
    totalDeductedMicros: number;
    totalEarnedMicros: number;
    billingSequence: number;
    source: string;
  };
  authoritativeCoinsDeducted: number;
  proposedDurationSeconds: number;
  proposedCoinsDeducted: number;
  deadLetterPresent: boolean;
  hasVideoCallDebitTxn: boolean;
  hasCreatorCreditTxn: boolean;
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

export interface AdminSupportTicketAttachment {
  name: string;
  mimeType: string;
  sizeBytes: number;
  isScreenshot: boolean;
  imageId?: string;
  url?: string;
  dataUrl?: string;
}

export interface AdminSupportTicket {
  id: string;
  userId: string;
  username: string;
  email: string | null;
  phone: string | null;
  contactPhone: string | null;
  userRole: string | null;
  role: 'user' | 'creator' | 'agency' | 'bd';
  category: string;
  subject: string;
  message: string;
  attachments?: AdminSupportTicketAttachment[];
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitterMembershipTier?: 'NONE' | 'VIP';
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

export type LeaderboardPeriod = '7d' | '30d' | '90d' | 'all';

export type HostLeaderboardSort =
  | 'calls'
  | 'talk_time'
  | 'earnings'
  | 'gross_spend'
  | 'avg_duration';

export type UserLeaderboardSort =
  | 'calls'
  | 'talk_time'
  | 'messages'
  | 'recharge_inr'
  | 'recharge_coins'
  | 'coins_received'
  | 'coins_spent';

export interface HostLeaderboardRow {
  rank: number;
  creatorId: string | null;
  hostUserId: string;
  hostName: string;
  avatarUrl: string | null;
  callCount: number;
  talkSeconds: number;
  talkMinutes: number;
  avgCallDurationSec: number;
  earningsCoins: number;
  grossSpendCoins: number;
  lifetimeEarningsCoins: number;
}

export interface HostLeaderboardResponse {
  period: LeaderboardPeriod;
  sort: HostLeaderboardSort;
  rows: HostLeaderboardRow[];
  note?: string;
}

export interface UserLeaderboardRow {
  rank: number;
  userId: string;
  label: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  walletCoins: number;
  callCount: number;
  talkSeconds: number;
  talkMinutes: number;
  totalMessages: number;
  freeMessages: number;
  paidMessages: number;
  rechargeCoins: number;
  rechargeInr: number;
  coinsReceived: number;
  coinsSpent: number;
  coinsSpentOnCalls: number;
}

export interface UserLeaderboardResponse {
  period: LeaderboardPeriod;
  sort: UserLeaderboardSort;
  rows: UserLeaderboardRow[];
  note?: string;
}

export interface RevenueSplitSummary {
  rangeDays: number;
  from: string;
  inrPerCoin: number;
  inrPerCoinNote: string;
  actual: {
    totalRevenue: number;
    hostRevenue: number;
    bdRevenue: number;
    agencyRevenue: number;
    platformRevenue: number;
  };
  scenarios: {
    withAgencyAndBd: {
      key: string;
      label: string;
      slices: Array<{ key: string; label: string; pct: number; coins: number }>;
      platformCoins: number;
    };
    independentHost: {
      key: string;
      label: string;
      slices: Array<{ key: string; label: string; pct: number; coins: number }>;
      platformCoins: number;
    };
  };
  combinedPlatformCoins: {
    actualSettled: number;
    policyWithStaff: number;
    policyIndependentHost: number;
  };
}

export interface BlockedHostRow {
  creatorId: string;
  hostName: string;
  creatorUserId: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  blockCount: number;
  reportCount: number;
  lastReportedAt: string | null;
  blockedBySample: Array<{ userId: string; label: string }>;
}

export interface BlockedHostsResponse {
  summary: { totalHosts: number; totalBlocks: number; totalReports: number };
  rows: BlockedHostRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
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
  getCreatorDetail: async (creatorId: string) => {
    const res = await api.get(`/admin/creators/${creatorId}/detail`);
    return res.data.data as {
      creator: import('../types/hostProfile').HostProfileCreator;
      user: import('../types/hostProfile').HostProfileUser;
      assignedAgencyId: string | null;
      assignedAgencyLabel: string | null;
    };
  },

  getCreatorsPerformancePage: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    agencyId?: string;
    bdId?: string;
    presenceStatus?: string;
  }): Promise<{
    creators: CreatorPerformance[];
    total: number;
    page: number;
    limit: number;
    presenceCounts?: { online: number; on_call: number; offline: number; total: number };
  }> => {
    const res = await api.get('/admin/creators/performance', { params });
    const data = res.data.data;
    return {
      creators: data.creators ?? [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 50,
      presenceCounts: data.presenceCounts,
    };
  },

  getCreatorsPerformance: async (): Promise<CreatorPerformance[]> => {
    const limit = 100;
    let page = 1;
    let total = Infinity;
    const all: CreatorPerformance[] = [];
    while (all.length < total) {
      const data = await adminService.getCreatorsPerformancePage({ page, limit });
      all.push(...data.creators);
      total = data.total;
      if (!data.creators.length || data.creators.length < limit) break;
      page += 1;
    }
    return all;
  },

  resetCreatorPresence: async (
    creatorId: string
  ): Promise<{ presenceStatus: string; isOnline: boolean }> => {
    const res = await api.post(`/admin/creators/${creatorId}/reset-presence`);
    return res.data.data;
  },

  deactivateCreator: async (creatorId: string) => {
    const res = await api.post(`/admin/creators/${creatorId}/deactivate`);
    return res.data;
  },

  reactivateCreator: async (creatorId: string) => {
    const res = await api.post(`/admin/creators/${creatorId}/reactivate`);
    return res.data;
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
  creatorAvatarUploadUrl: async (
    contentType: string,
    declaredSizeBytes: number,
  ): Promise<{ uploadUrl: string; sessionId: string; imageId: string; expiresAt: string }> => {
    const res = await api.post('/images/direct-upload', {
      purpose: 'creator-avatar',
      declaredSizeBytes,
      declaredMimeType: contentType,
    });
    return parseDirectUploadPayload(res.data);
  },

  creatorAvatarCommit: async (
    creatorId: string,
    sessionId: string,
  ): Promise<{
    avatar: import('../types/hostProfile').HostAvatarDto | null;
    avatarUrl: string | null;
    photo: string | null;
    galleryImages: GalleryImageDto[];
    user: { avatar: import('../types/hostProfile').HostAvatarDto | null; avatarUrl: string | null } | null;
  }> => {
    const res = await api.post(`/admin/creators/${creatorId}/avatar/commit`, { sessionId });
    return res.data.data;
  },

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
    return parseDirectUploadPayload(res.data);
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
    page?: number;
    limit?: number;
  }): Promise<{
    users: UserAnalytics[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append('query', params.query);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.referrerAgencyId) searchParams.append('referrerAgencyId', params.referrerAgencyId);
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const res = await api.get(`/admin/users/analytics?${searchParams.toString()}`);
    const d = res.data.data;
    return {
      users: d.users,
      total: Number(d.total ?? 0),
      page: d.page ?? 1,
      limit: d.limit ?? 50,
      totalPages: d.totalPages ?? 1,
    };
  },

  getWebsiteUsers: async (params?: {
    audience?: WebsiteAudienceCategory | 'all';
    query?: string;
    sort?: 'website_since' | 'last_website_login';
    direction?: 'asc' | 'desc';
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: WebsiteUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    meta: AttributionCoverageMeta & {
      audience: WebsiteAudienceCategory | 'all';
      sort: 'website_since' | 'last_website_login';
      direction: 'asc' | 'desc';
      range: { from: string; to: string } | null;
    };
  }> => {
    const res = await api.get('/admin/users/website', { params });
    return res.data.data;
  },

  getWebsiteVisits: async (params?: {
    from?: string;
    to?: string;
  }): Promise<{
    uniqueVisitors: number;
    meta: AttributionCoverageMeta & {
      range: { from: string; to: string } | null;
    };
  }> => {
    const res = await api.get('/admin/analytics/website-visits', { params });
    return res.data.data;
  },

  getUsersLoginAnalytics: async (params?: {
    cohort?: 'first_time' | 'relogin' | 'all';
    activityKind?: 'interactive_login' | 'session_restore' | 'all';
    query?: string;
    sort?: string;
    referrerAgencyId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: UserAnalytics[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    meta: AttributionCoverageMeta & {
      effectiveFilters: {
        cohort: 'first_time' | 'relogin' | 'all';
        activityKind: 'interactive_login' | 'session_restore' | 'all';
        sort: string;
      };
      range: { from: string; to: string } | null;
      classifiedEventCount: number;
      unknownEventCount: number;
      authSyncCaveat: string;
    };
  }> => {
    const res = await api.get('/admin/users/login-analytics', { params });
    return res.data.data;
  },

  getUsersSummary: async () => {
    const res = await api.get('/admin/analytics/users/summary');
    return res.data.data as {
      totalUsers: number;
      signupsToday: number;
      signups7d: number;
      signups30d: number;
      onboardedUsers: number;
      timezone?: string;
      todayIst?: string;
      generatedAt: string;
    };
  },

  getUsersLoginSeries: async (granularity: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    const res = await api.get('/admin/analytics/users/login-series', { params: { granularity } });
    return res.data.data as {
      granularity: 'daily' | 'weekly' | 'monthly';
      from: string;
      to: string;
      points: Array<{
        label: string;
        startDate: string;
        uniqueLogins: number;
        loginEvents: number;
      }>;
      note?: string;
      generatedAt: string;
    };
  },

  getUsersSignupSeries: async (granularity: 'hourly' | 'daily' = 'hourly') => {
    const res = await api.get('/admin/analytics/users/signup-series', { params: { granularity } });
    return res.data.data as {
      granularity: 'hourly' | 'daily';
      from: string;
      to: string;
      points: Array<{ label: string; startDate: string; signups: number }>;
      note?: string;
      generatedAt: string;
    };
  },

  getMomentsPaidUsers: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get('/admin/analytics/moments/paid-users', { params });
    return res.data.data;
  },

  getMomentsPremiumUsers: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get('/admin/analytics/moments/premium-users', { params });
    return res.data.data;
  },

  getVipPaidUsers: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'expired' | 'all';
  }) => {
    const res = await api.get('/admin/analytics/vip/paid-users', { params });
    return res.data.data;
  },

  getRevenueAnalyticsSummary: async (period: 'today' | '7d' | '30d' = '30d') => {
    const res = await api.get('/admin/analytics/revenue/summary', { params: { period } });
    return res.data.data;
  },

  getWalletTransactions: async (params?: {
    page?: number;
    limit?: number;
    source?: string;
    from?: string;
    to?: string;
  }) => {
    const res = await api.get('/admin/wallet/transactions', { params });
    return res.data.data;
  },

  getFinancePayments: async (params?: {
    page?: number;
    limit?: number;
    source: string;
    from?: string;
    to?: string;
  }) => {
    const res = await api.get('/admin/finance/payments', { params });
    return res.data.data;
  },

  getPaymentPurchaseLogs: async (params?: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
  }) => {
    const res = await api.get('/admin/finance/payment-logs', { params });
    return res.data.data;
  },

  getFinancePayoutsSummary: async (period: 'today' | '7d' | '30d' = '30d') => {
    const res = await api.get('/admin/finance/payouts/summary', { params: { period } });
    return res.data.data;
  },

  getFinanceSettlements: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get('/admin/finance/settlements', { params });
    return res.data.data;
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

  getSettlementRetryPreview: async (callId: string): Promise<SettlementRetryPreview> => {
    const res = await api.get(`/admin/calls/${callId}/settlement-retry-preview`);
    return res.data.data;
  },

  retryCallSettlement: async (
    callId: string,
    opts?: { force?: boolean }
  ): Promise<{ status: string; message: string }> => {
    const res = await api.post(`/admin/calls/${callId}/retry-settlement`, {
      force: opts?.force === true,
    });
    return res.data.data;
  },

  retryCallSettlementBulk: async (
    callIds: string[],
    opts?: { force?: boolean }
  ): Promise<Array<{ callId: string; status: string; message: string }>> => {
    const res = await api.post('/admin/calls/retry-settlement-bulk', {
      callIds,
      force: opts?.force === true,
    });
    return res.data.data.results;
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
    /** When type=staff: filter by bd or agency role */
    staffRole?: 'bd' | 'agency';
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
    if (params?.staffRole) searchParams.append('staffRole', params.staffRole);
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

  // ── Blocked hosts (user blocks + creator reports) ──
  getBlockedHosts: async (params?: {
    page?: number;
    limit?: number;
    sort?: 'blocks_desc' | 'blocks_asc' | 'reports_desc' | 'name_asc';
  }): Promise<BlockedHostsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.sort) searchParams.append('sort', params.sort);
    const res = await api.get(`/admin/blocked-hosts?${searchParams.toString()}`);
    return res.data.data;
  },

  // ── Support Tickets ────────────────────────────────
  getCoinsPaidUsers: async (params?: { page?: number; limit?: number }) => {
    const res = await api.get('/admin/analytics/coins/paid-users', { params });
    return res.data.data as {
      summary: {
        uniqueBuyersAllTime: number;
        buyersToday: number;
        buyers7d: number;
        buyers30d: number;
        revenueInr30d: number;
      };
      rows: Array<{
        rank: number;
        userId: string;
        username: string;
        email: string | null;
        phone: string | null;
        purchaseCount: number;
        totalRechargeCoins: number;
        totalRechargeInr: number;
        lastPurchaseAt: string;
      }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  getSupportTickets: async (params?: {
    role?: string;
    status?: string;
    priority?: string;
    membership?: string;
    source?: string;
    subject?: string;
    subjectContains?: string;
    becomeCreatorOnly?: boolean;
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
    if (params?.membership) searchParams.append('membership', params.membership);
    if (params?.source) searchParams.append('source', params.source);
    if (params?.subject) searchParams.append('subject', params.subject);
    if (params?.subjectContains) searchParams.append('subjectContains', params.subjectContains);
    if (params?.becomeCreatorOnly) searchParams.append('becomeCreatorOnly', 'true');
    if (params?.creatorReportsOnly) searchParams.append('creatorReports', 'true');
    if (params?.staffPortalOnly) searchParams.append('staffPortal', 'true');
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    const res = await api.get(`/admin/support?${searchParams.toString()}`);
    return res.data.data;
  },

  exportSupportTicketsCsv: async (params?: {
    from?: string;
    to?: string;
    becomeCreatorOnly?: boolean;
    subject?: string;
    subjectContains?: string;
    role?: string;
    status?: string;
  }): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    if (params?.becomeCreatorOnly) searchParams.append('becomeCreatorOnly', 'true');
    if (params?.subject) searchParams.append('subject', params.subject);
    if (params?.subjectContains) searchParams.append('subjectContains', params.subjectContains);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);
    const res = await api.get(`/admin/support/export.csv?${searchParams.toString()}`, {
      responseType: 'blob',
    });
    return res.data as Blob;
  },

  updateTicketStatus: async (
    id: string,
    status: string,
    adminNotes?: string
  ): Promise<{ ticketId: string; oldStatus: string; newStatus: string }> => {
    const res = await api.patch(`/admin/support/${id}/status`, { status, adminNotes });
    return res.data.data;
  },

  getRevenueSplitSummary: async (days = 30): Promise<RevenueSplitSummary> => {
    const res = await api.get('/admin/revenue-split/summary', { params: { days } });
    return res.data.data;
  },

  getPlatformRevenue: async (): Promise<{
    bdBps: number;
    agencyBps: number;
    hostSharePct?: number;
    bdPctOfHostEarnings?: number;
    agencyPctOfHostEarnings?: number;
    note?: string;
  }> => {
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

  getLeaderboardHosts: async (params?: {
    period?: LeaderboardPeriod;
    sort?: HostLeaderboardSort;
    limit?: number;
    cached?: boolean;
  }): Promise<HostLeaderboardResponse> => {
    const endpoint = params?.cached
      ? '/admin/leaderboards/hosts/cached'
      : '/admin/leaderboards/hosts';
    const rest = params
      ? { period: params.period, sort: params.sort, limit: params.limit }
      : undefined;
    const res = await api.get(endpoint, { params: rest });
    return res.data.data;
  },

  getLeaderboardUsers: async (params?: {
    period?: LeaderboardPeriod;
    sort?: UserLeaderboardSort;
    limit?: number;
  }): Promise<UserLeaderboardResponse> => {
    const res = await api.get('/admin/leaderboards/users', { params });
    return res.data.data;
  },

  getIntegrityChecks: async (): Promise<{
    overallHealthy: boolean;
    checks: {
      videoCalls: { unsettledCount: number; status: string };
      balanceIntegrity: { mismatchCount: number; status: string };
    };
  }> => {
    const res = await api.get('/admin/integrity-checks');
    return res.data.data;
  },

  getMomentsAdminConfig: async (): Promise<{
    momentsEnabled: boolean;
    freePreviewLimit: number;
  }> => {
    const res = await api.get('/admin/moments/config');
    return res.data.data;
  },

  getMomentsFreePreviews: async (): Promise<{
    listVersion: number;
    items: MomentsFreePreviewRow[];
  }> => {
    const res = await api.get('/admin/moments/free-previews');
    return res.data.data;
  },

  reorderMomentsFreePreviews: async (body: {
    orderedMomentIds: string[];
    expectedVersion: number;
  }): Promise<{ listVersion: number }> => {
    const res = await api.put('/admin/moments/free-previews/reorder', body);
    return res.data.data;
  },

  addMomentsFreePreview: async (body: {
    momentId: string;
    enabled?: boolean;
  }): Promise<{ listVersion: number }> => {
    const res = await api.post('/admin/moments/free-previews', body);
    return res.data.data;
  },

  removeMomentsFreePreview: async (
    momentId: string,
  ): Promise<{ listVersion: number }> => {
    const res = await api.delete(`/admin/moments/free-previews/${momentId}`);
    return res.data.data;
  },

  browseMomentsForAdmin: async (params?: {
    q?: string;
    type?: 'photo' | 'video';
    hasPreview?: 'yes' | 'no';
    visibilityTier?: 'PUBLIC' | 'VIP';
    limit?: number;
    cursor?: string;
  }): Promise<{ items: MomentsBrowseRow[]; nextCursor?: string; total: number }> => {
    const res = await api.get('/admin/moments/browse', { params });
    return res.data.data;
  },

  patchMomentVisibilityTier: async (
    momentId: string,
    visibilityTier: 'PUBLIC' | 'VIP',
  ): Promise<{ momentId: string; visibilityTier: 'PUBLIC' | 'VIP' }> => {
    const res = await api.patch(`/admin/moments/${momentId}/visibility-tier`, {
      visibilityTier,
    });
    return res.data.data;
  },

  getUploadRewardsConfig: async (): Promise<{
    photoRewardCoins: number;
    videoRewardCoins: number;
  }> => {
    const res = await api.get('/admin/moments/upload-rewards/config');
    return res.data.data;
  },

  getPendingUploadRewards: async (): Promise<{ items: MomentUploadRewardRow[] }> => {
    const res = await api.get('/admin/moments/upload-rewards/pending');
    return res.data.data;
  },

  approveUploadReward: async (
    id: string,
  ): Promise<{
    id: string;
    uploadRewardStatus: string;
    coinsCredited: number;
    newBalance: number;
    rewardCoins: number;
  }> => {
    const res = await api.post('/admin/moments/upload-rewards/approve', { id });
    return res.data.data;
  },

  rejectUploadReward: async (
    id: string,
  ): Promise<{ id: string; uploadRewardStatus: string }> => {
    const res = await api.post('/admin/moments/upload-rewards/reject', { id });
    return res.data.data;
  },

  listAllMomentsForAdmin: async (params?: {
    q?: string;
    type?: 'photo' | 'video';
    moderationStatus?: string;
    processingStatus?: string;
    uploadRewardStatus?: 'pending' | 'approved' | 'rejected';
    limit?: number;
    cursor?: string;
  }): Promise<{ items: MomentsGalleryRow[]; nextCursor?: string; total: number }> => {
    const res = await api.get('/admin/moments/all', { params });
    return res.data.data;
  },

  deleteMomentAsAdmin: async (
    momentId: string,
    options?: { deductCoins?: boolean; reason?: string },
  ): Promise<{
    momentId: string;
    coinsClawedBack: number;
    deductCoins: boolean;
    creatorNewBalance: number;
  }> => {
    const res = await api.delete(`/admin/moments/${momentId}`, {
      data: {
        deductCoins: options?.deductCoins ?? false,
        reason: options?.reason,
      },
    });
    return res.data.data;
  },
};

export interface MomentsFreePreviewRow {
  momentId: string;
  order: number;
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  caption?: string | null;
  type: 'photo' | 'video';
  viewsCount: number;
  processingStatus: string;
  moderationStatus: string;
  visibilityTier?: 'PUBLIC' | 'VIP';
  createdAt: string;
  thumbnailUrl?: string;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
    verified: boolean;
  };
}

export interface MomentsBrowseRow {
  momentId: string;
  caption?: string | null;
  type: 'photo' | 'video';
  viewsCount: number;
  processingStatus: string;
  moderationStatus: string;
  visibilityTier?: 'PUBLIC' | 'VIP';
  createdAt: string;
  thumbnailUrl?: string;
  inFreePreview?: boolean;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
    verified: boolean;
  };
}

export interface MomentUploadRewardRow {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl?: string;
  type: 'photo' | 'video';
  caption?: string | null;
  createdAt: string;
  thumbnailUrl?: string;
  uploadRewardStatus: string;
  rewardCoins: number;
}

export interface MomentsGalleryRow {
  momentId: string;
  caption?: string | null;
  type: 'photo' | 'video';
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  processingStatus: string;
  moderationStatus: string;
  visibilityTier?: 'PUBLIC' | 'VIP';
  uploadRewardStatus: string;
  coinsRewarded: number;
  createdAt: string;
  thumbnailUrl?: string;
  inFreePreview?: boolean;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
    verified: boolean;
  };
}
