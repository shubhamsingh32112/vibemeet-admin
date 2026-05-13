import agencyApi from '../config/agencyApi';

export type AgencyDashboardData = {
  agencyId: string;
  staffCoinsBalance: number;
  bdTotal: number;
  bdActive: number;
  bdInactive: number;
  totalHosts: number;
  onlineHosts: number;
  revenueCoins: { today: number; last7d: number; last30d: number };
  withdrawals: {
    pendingCount: number;
    completedCount: number;
    recent: Array<{
      id: string;
      amount: number;
      status: string;
      requestedAt: string;
      processedAt: string | null;
      createdAt: string;
    }>;
  };
  bdAnalytics: Array<{
    id: string;
    email: string;
    displayName: string | null;
    referralCode: string | null;
    agentDisabled: boolean;
    avatarUrl: string | null;
    hostCount: number;
    onlineHostCount: number;
    callsLast7d: number;
    bdEarningsCoinsLast7d: number;
    agencyRevenueFromBdLast7d: number;
  }>;
  topBdsLeaderboard: Array<{
    rank: number;
    id: string;
    displayLabel: string;
    avatarUrl: string | null;
    hostCount: number;
    revenueGeneratedCoins: number;
    commission5PctCoins: number;
    activeHosts: number;
  }>;
  topHostsLeaderboard: Array<{
    rank: number;
    hostName: string;
    avatarUrl: string | null;
    bdName: string;
    minutes: number;
    calls: number;
    earningsCoins: number;
    incentiveCoins: number;
  }>;
  revenueSeries14d: Array<{ date: string; coins: number }>;
  activitySeries7d: Array<{ date: string; calls: number; minutes: number }>;
  recentActivity: Array<{
    id: string;
    type: 'withdrawal';
    message: string;
    at: string;
  }>;
  payoutSummary: {
    pendingCoins: number;
    processingCoins: number;
    paidCoins: number;
    nextPayoutNote: string;
  };
};

export const agencyPortalService = {
  getSummary: async () => {
    const res = await agencyApi.get('/agency/summary');
    return res.data.data as {
      agencyId: string;
      email?: string;
      displayName?: string | null;
      bdCount: number;
      hostCount: number;
      mustChangePassword?: boolean;
    };
  },

  getDashboard: async (): Promise<AgencyDashboardData> => {
    const res = await agencyApi.get('/agency/dashboard');
    return res.data.data as AgencyDashboardData;
  },

  listBds: async () => {
    const res = await agencyApi.get('/agency/bds');
    return res.data.data.bds as Array<{
      id: string;
      email: string;
      displayName: string | null;
      referralCode: string | null;
      agentDisabled: boolean;
      hostCount: number;
      createdAt: string;
    }>;
  },

  createBd: async (email: string, displayName?: string) => {
    const res = await agencyApi.post('/agency/bds', {
      email,
      displayName: displayName || undefined,
    });
    return res.data.data as {
      id: string;
      email: string;
      referralCode: string | null;
      generatedPassword: string;
    };
  },

  changePassword: async (body: { currentPassword: string; newPassword: string }) => {
    const res = await agencyApi.post('/agency/change-password', body);
    return res.data.data as { mustChangePassword: boolean };
  },

  updateProfile: async (body: { displayName: string }) => {
    const res = await agencyApi.patch('/agency/profile', body);
    return res.data.data as { displayName: string };
  },

  requestStaffWithdrawal: async (body: {
    amount: number;
    name?: string;
    number?: string;
    upi?: string;
    accountNumber?: string;
    ifsc?: string;
  }) => {
    const res = await agencyApi.post('/agency/staff-withdrawals', body);
    return res.data.data as { id: string; amount: number; status: string };
  },
};
