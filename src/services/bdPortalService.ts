import bdApi from '../config/bdApi';

export type BdDashboardData = {
  agencyId: string;
  staffCoinsBalance: number;
  agencyTotal: number;
  agencyActive: number;
  agencyInactive: number;
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
  agencyAnalytics: Array<{
    id: string;
    email: string;
    displayName: string | null;
    referralCode: string | null;
    agencyDisabled: boolean;
    hostCount: number;
    onlineHostCount: number;
    callsLast7d: number;
    agencyEarningsCoinsLast7d: number;
    bdRevenueFromAgencyLast7d: number;
  }>;
};

export const bdPortalService = {
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await bdApi.post('/bd/change-password', { currentPassword, newPassword });
    return res.data;
  },

  getSummary: async () => {
    const res = await bdApi.get('/bd/summary');
    return res.data.data as {
      bdId: string;
      email?: string;
      displayName?: string | null;
      agencyCount: number;
      mustChangePassword?: boolean;
      hostCount: number;
    };
  },

  getDashboard: async (): Promise<BdDashboardData> => {
    const res = await bdApi.get('/bd/dashboard');
    const data = res.data.data;
    return {
      agencyId: data.agencyId ?? data.bdId ?? '',
      staffCoinsBalance: data.staffCoinsBalance ?? 0,
      agencyTotal: data.agencyTotal ?? data.bdTotal ?? 0,
      agencyActive: data.agencyActive ?? data.bdActive ?? 0,
      agencyInactive: data.agencyInactive ?? data.bdInactive ?? 0,
      totalHosts: data.totalHosts ?? 0,
      onlineHosts: data.onlineHosts ?? 0,
      revenueCoins: data.revenueCoins ?? { today: 0, last7d: 0, last30d: 0 },
      withdrawals: data.withdrawals ?? { pendingCount: 0, completedCount: 0, recent: [] },
      agencyAnalytics: (data.agencyAnalytics ?? data.bdAnalytics ?? []).map(
        (row: Record<string, unknown>) => ({
          id: String(row.id),
          email: String(row.email),
          displayName: (row.displayName as string | null) ?? null,
          referralCode: (row.referralCode as string | null) ?? null,
          agencyDisabled: Boolean(row.agencyDisabled ?? row.agentDisabled),
          hostCount: Number(row.hostCount ?? 0),
          onlineHostCount: Number(row.onlineHostCount ?? 0),
          callsLast7d: Number(row.callsLast7d ?? 0),
          agencyEarningsCoinsLast7d: Number(
            row.agencyEarningsCoinsLast7d ?? row.bdEarningsCoinsLast7d ?? 0
          ),
          bdRevenueFromAgencyLast7d: Number(
            row.bdRevenueFromAgencyLast7d ?? row.agencyRevenueFromBdLast7d ?? 0
          ),
        })
      ),
    };
  },

  listAgencies: async () => {
    const res = await bdApi.get('/bd/agencies');
    const list = res.data.data.agencies ?? res.data.data.bds ?? [];
    return list as Array<{
      id: string;
      email: string;
      displayName: string | null;
      referralCode: string | null;
      agencyDisabled: boolean;
      staffMustChangePassword: boolean;
      hostCount: number;
      createdAt: string;
    }>;
  },

  createAgency: async (email: string, displayName?: string) => {
    const res = await bdApi.post('/bd/agencies', {
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
    const res = await bdApi.post('/bd/staff-withdrawals', body);
    return res.data.data as { id: string; amount: number; status: string };
  },
};
