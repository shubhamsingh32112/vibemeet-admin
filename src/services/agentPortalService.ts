import agentApi from '../config/agentApi';

export interface AgentSummary {
  pendingApplications: number;
  pendingWithdrawals: number;
  activeCreators: number;
}

export interface AgentApplicationRow {
  id: string;
  referralCodeUsed: string;
  createdAt: string;
  applicant: {
    id: string;
    email?: string;
    phone?: string;
    username?: string;
    avatar?: string;
    createdAt?: string;
  } | null;
}

export interface AgentCreatorRow {
  id: string;
  userId: string;
  name: string;
  photo: string;
  categories: string[];
  price: number;
  age?: number;
  earningsCoins: number;
  updatedAt: string;
  username?: string;
  email?: string;
  phone?: string;
  coins?: number;
}

export interface AgentWithdrawalRow {
  id: string;
  creatorUserId: string;
  creatorName: string;
  creatorEmail: string | null;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
  name: string | null;
  number: string | null;
  upi: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  createdAt: string;
}

export const agentPortalService = {
  getSummary: async (): Promise<AgentSummary> => {
    const res = await agentApi.get('/agent/summary');
    return res.data.data;
  },

  getPendingApplications: async (page = 1, limit = 50) => {
    const res = await agentApi.get('/agent/pending-applications', { params: { page, limit } });
    return res.data.data as {
      applications: AgentApplicationRow[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  acceptApplication: async (id: string) => {
    const res = await agentApi.post(`/agent/applications/${id}/accept`);
    return res.data.data;
  },

  rejectApplication: async (id: string, rejectionReason?: string) => {
    const res = await agentApi.post(`/agent/applications/${id}/reject`, { rejectionReason });
    return res.data.data;
  },

  getCreators: async (params?: { page?: number; limit?: number; sort?: string; dir?: string }) => {
    const res = await agentApi.get('/agent/creators', { params });
    return res.data.data as {
      creators: AgentCreatorRow[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  getCreatorDetail: async (creatorId: string) => {
    const res = await agentApi.get(`/agent/creators/${creatorId}`);
    return res.data.data;
  },

  getWithdrawals: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await agentApi.get('/agent/withdrawals', { params });
    return res.data.data as {
      withdrawals: AgentWithdrawalRow[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  approveWithdrawal: async (id: string, notes?: string) => {
    const res = await agentApi.post(`/agent/withdrawals/${id}/approve`, { notes });
    return res.data.data;
  },

  rejectWithdrawal: async (id: string, notes: string) => {
    const res = await agentApi.post(`/agent/withdrawals/${id}/reject`, { notes });
    return res.data.data;
  },

  markWithdrawalPaid: async (id: string, notes?: string) => {
    const res = await agentApi.post(`/agent/withdrawals/${id}/mark-paid`, { notes });
    return res.data.data;
  },

  /** Shared staff route: update creator profile (admin or owning agent). */
  updateCreatorProfile: async (
    creatorId: string,
    body: Partial<{ name: string; about: string; photo: string; categories: string[]; price: number; age: number }>
  ) => {
    const res = await agentApi.put(`/creator/${creatorId}`, body);
    return res.data.data;
  },

  patchCreatorUser: async (
    creatorId: string,
    body: Partial<{ username: string; avatar: string | null; categories: string[] }>
  ) => {
    const res = await agentApi.patch(`/admin/creators/${creatorId}/user`, body);
    return res.data.data;
  },
};
