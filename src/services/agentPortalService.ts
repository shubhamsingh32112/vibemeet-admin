import agentApi from '../config/agentApi';

export interface AgentSummary {
  /** Users referred by this agent who are not yet creators */
  referredUsersAwaitingPromotion: number;
  /** @deprecated Same as referredUsersAwaitingPromotion */
  pendingApplications: number;
  pendingWithdrawals: number;
  activeCreators: number;
  totalCreators: number;
  onlineCreators: number;
  mustChangePassword?: boolean;
  hostRevenueCoins?: {
    today: number;
    last7d: number;
  };
  bdEarningsCoins?: {
    today: number;
    last7d: number;
    totalBalance: number;
  };
}

export interface AgentReferredUserRow {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  createdAt: string;
  referralCodeUsed: string | null;
  hasCreator: boolean;
  creatorId: string | null;
  /** BD onboarding funnel (UI defaults missing values to `none`). */
  hostOnboardingStatus?: 'none' | 'pending_bd_approval' | 'approved' | 'rejected';
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
    location?: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'paid';
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
    return res.data.data as AgentSummary;
  },

  changePassword: async (body: { currentPassword: string; newPassword: string }) => {
    const res = await agentApi.post('/agent/change-password', body);
    return res.data.data as { mustChangePassword: boolean };
  },

  updateProfile: async (body: { displayName: string }) => {
    const res = await agentApi.patch('/agent/profile', body);
    return res.data.data as { displayName: string };
  },

  getReferredUsers: async (params?: { page?: number; limit?: number }) => {
    const res = await agentApi.get('/agent/referred-users', { params });
    return res.data.data as {
      users: AgentReferredUserRow[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  rejectReferredUser: async (userId: string, reason?: string) => {
    await agentApi.post(`/agent/referred-users/${userId}/reject`, reason ? { reason } : undefined);
  },

  approveReferredUser: async (userId: string) => {
    await agentApi.post(`/agent/referred-users/${userId}/approve`);
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

  createAgentCreator: async (
    body:
      | { userId: string }
      | {
          userId: string;
          name: string;
          about: string;
          photo: string;
          categories?: string[];
          age?: number;
          location?: string;
        },
  ) => {
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
    body: Partial<{
      name: string;
      about: string;
      photo: string;
      categories: string[];
      price: number;
      age: number;
      location: string | null;
    }>
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

  creatorGalleryUploadUrl: async (
    _creatorId: string,
    contentType: string,
    declaredSizeBytes: number,
  ) => {
    const res = await agentApi.post('/images/direct-upload', {
      purpose: 'creator-gallery',
      declaredSizeBytes,
      declaredMimeType: contentType,
    });
    return res.data.data as {
      uploadUrl: string;
      sessionId: string;
      imageId: string;
      expiresAt: string;
    };
  },

  creatorGalleryCommit: async (creatorId: string, sessionId: string) => {
    const res = await agentApi.post(`/admin/creators/${creatorId}/gallery/commit`, { sessionId });
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
