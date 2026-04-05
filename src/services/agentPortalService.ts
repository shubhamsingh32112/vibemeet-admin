import agentApi from '../config/agentApi';

export interface AgentSummary {
  pendingApplications: number;
  pendingWithdrawals: number;
  activeCreators: number;
  totalCreators: number;
  onlineCreators: number;
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
  availability: 'online' | 'busy';
  pendingWithdrawal: { id: string; amount: number; requestedAt: string } | null;
  periodTalkMinutes: number;
  periodCoinsEarned: number;
  periodCallCount: number;
  allTimeTalkMinutes: number;
}

export type AgentCreatorsPeriod = 'today' | '7d' | '30d' | 'all';

export interface GalleryImageDto {
  id: string;
  url: string;
  storagePath: string;
  position: number;
  createdAt: string;
}

export interface AgentCreatorDetailData {
  meta: { period: AgentCreatorsPeriod };
  creator: {
    id: string;
    userId: string;
    name: string;
    about: string;
    photo: string;
    galleryImages: GalleryImageDto[];
    categories: string[];
    price: number;
    age?: number;
    earningsCoins: number;
    isOnline: boolean;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    username?: string;
    email?: string;
    phone?: string;
    coins?: number;
    avatar?: string;
    profileRevision?: number;
  };
  availability: 'online' | 'busy';
  earningsSummaryCoins: { last1d: number; last7d: number; last30d: number };
  callStats: {
    periodTalkMinutes: number;
    periodCoinsEarned: number;
    periodCallCount: number;
    allTimeTalkMinutes: number;
    allTimeCoinsEarned: number;
    allTimeCallCount: number;
  };
  pendingWithdrawal: { id: string; amount: number; requestedAt: string } | null;
}

export interface AgentSearchUserRow {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  createdAt: string;
  isCreator: boolean;
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

  getCreators: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    dir?: 'asc' | 'desc';
    period?: AgentCreatorsPeriod;
  }) => {
    const res = await agentApi.get('/agent/creators', { params });
    return res.data.data as {
      creators: AgentCreatorRow[];
      meta: { period: string };
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  getCreatorDetail: async (creatorId: string, period?: AgentCreatorsPeriod) => {
    const res = await agentApi.get(`/agent/creators/${creatorId}`, {
      params: period ? { period } : undefined,
    });
    return res.data.data as AgentCreatorDetailData;
  },

  searchUsersForAgent: async (q: string, limit = 30) => {
    const res = await agentApi.get('/agent/search-users', { params: { q, limit } });
    return res.data.data.users as AgentSearchUserRow[];
  },

  createAgentCreator: async (body: {
    userId: string;
    name: string;
    about: string;
    photo: string;
    price: number;
    categories?: string[];
    age?: number;
  }) => {
    const res = await agentApi.post('/agent/creators', body);
    return res.data.data as { creator: { id: string; userId: string; name: string } };
  },

  deleteCreator: async (creatorId: string) => {
    await agentApi.delete(`/creator/${creatorId}`);
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

  creatorGalleryUploadUrl: async (creatorId: string, contentType: string) => {
    const res = await agentApi.post(`/admin/creators/${creatorId}/gallery/upload-url`, { contentType });
    return res.data.data as {
      uploadUrl: string;
      storagePath: string;
      imageId: string;
      expiresAt: string;
      contentType: string;
    };
  },

  creatorGalleryCommit: async (creatorId: string, imageId: string, storagePath: string) => {
    const res = await agentApi.post(`/admin/creators/${creatorId}/gallery/commit`, { imageId, storagePath });
    return res.data.data.galleryImages as GalleryImageDto[];
  },

  creatorGalleryDelete: async (creatorId: string, imageId: string) => {
    const res = await agentApi.delete(`/admin/creators/${creatorId}/gallery/${imageId}`);
    return res.data.data.galleryImages as GalleryImageDto[];
  },

  creatorGalleryReorder: async (creatorId: string, imageIds: string[]) => {
    const res = await agentApi.patch(`/admin/creators/${creatorId}/gallery/reorder`, { imageIds });
    return res.data.data.galleryImages as GalleryImageDto[];
  },
};
