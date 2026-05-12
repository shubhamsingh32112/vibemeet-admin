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
    hostCount: number;
    onlineHostCount: number;
    callsLast7d: number;
    bdEarningsCoinsLast7d: number;
    agencyRevenueFromBdLast7d: number;
  }>;
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
