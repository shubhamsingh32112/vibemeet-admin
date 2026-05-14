import agencyApi from '../config/agencyApi';

export interface AgencySummary {
  /** Users referred by this agency who are not yet creators */
  referredUsersAwaitingPromotion: number;
  /** @deprecated Same as referredUsersAwaitingPromotion */
  pendingApplications: number;
  pendingWithdrawals: number;
  activeCreators: number;
  totalCreators: number;
  onlineCreators: number;
  agencyEarningsCoins?: {
    today: number;
    last7d: number;
    totalBalance: number;
  };
  hostRevenueCoins?: {
    today: number;
    last7d: number;
  };
}

export interface AgencyReferredUserRow {
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
  hostOnboardingStatus?: 'none' | 'pending_bd_approval' | 'approved' | 'rejected';
}

export interface AgencyCreatorRow {
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

export type AgencyCreatorsPeriod = 'today' | '7d' | '30d' | 'all';

export interface GalleryImageDto {
  id: string;
  url: string;
  storagePath: string;
  position: number;
  createdAt: string;
}

export interface AgencyCreatorDetailData {
  meta: { period: AgencyCreatorsPeriod };
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

export interface AgencySearchUserRow {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  createdAt: string;
  isCreator: boolean;
}

export interface AgencyWithdrawalRow {
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

export const agencyPortalService = {
  getSummary: async (): Promise<AgencySummary> => {
    const res = await agencyApi.get('/agency/summary');
    const data = res.data.data;
    return {
      ...data,
      agencyEarningsCoins: data.agencyEarningsCoins ?? data.bdEarningsCoins,
    };
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await agencyApi.post('/agency/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data.data as { mustChangePassword: boolean };
  },

  getReferredUsers: async (params?: { page?: number; limit?: number }) => {
    const res = await agencyApi.get('/agency/referred-users', { params });
    return res.data.data as {
      users: AgencyReferredUserRow[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  rejectReferredUser: async (userId: string, reason?: string) => {
    await agencyApi.post(`/agency/referred-users/${userId}/reject`, reason ? { reason } : undefined);
  },

  approveReferredUser: async (userId: string) => {
    await agencyApi.post(`/agency/referred-users/${userId}/approve`);
  },

  getCreators: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    dir?: 'asc' | 'desc';
    period?: AgencyCreatorsPeriod;
  }) => {
    const res = await agencyApi.get('/agency/creators', { params });
    return res.data.data as {
      creators: AgencyCreatorRow[];
      meta: { period: string };
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  getCreatorDetail: async (creatorId: string, period?: AgencyCreatorsPeriod) => {
    const res = await agencyApi.get(`/agency/creators/${creatorId}`, {
      params: period ? { period } : undefined,
    });
    return res.data.data as AgencyCreatorDetailData;
  },

  searchUsersForAgency: async (q: string, limit = 30) => {
    const res = await agencyApi.get('/agency/search-users', { params: { q, limit } });
    return res.data.data.users as AgencySearchUserRow[];
  },

  createAgencyCreator: async (body: {
    userId: string;
    name: string;
    about: string;
    photo: string;
    categories?: string[];
    age?: number;
    location?: string;
  }) => {
    const res = await agencyApi.post('/agency/creators', body);
    return res.data.data as { creator: { id: string; userId: string; name: string } };
  },

  deleteCreator: async (creatorId: string) => {
    await agencyApi.delete(`/creator/${creatorId}`);
  },

  getWithdrawals: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await agencyApi.get('/agency/withdrawals', { params });
    return res.data.data as {
      withdrawals: AgencyWithdrawalRow[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  approveWithdrawal: async (id: string, notes?: string) => {
    const res = await agencyApi.post(`/agency/withdrawals/${id}/approve`, { notes });
    return res.data.data;
  },

  rejectWithdrawal: async (id: string, notes: string) => {
    const res = await agencyApi.post(`/agency/withdrawals/${id}/reject`, { notes });
    return res.data.data;
  },

  markWithdrawalPaid: async (id: string, notes?: string) => {
    const res = await agencyApi.post(`/agency/withdrawals/${id}/mark-paid`, { notes });
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
    const res = await agencyApi.put(`/creator/${creatorId}`, body);
    return res.data.data;
  },

  patchCreatorUser: async (
    creatorId: string,
    body: Partial<{ username: string; avatar: string | null; categories: string[] }>
  ) => {
    const res = await agencyApi.patch(`/admin/creators/${creatorId}/user`, body);
    return res.data.data;
  },

  creatorGalleryUploadUrl: async (
    _creatorId: string,
    contentType: string,
    declaredSizeBytes: number,
  ) => {
    const res = await agencyApi.post('/images/direct-upload', {
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
    const res = await agencyApi.post(`/admin/creators/${creatorId}/gallery/commit`, { sessionId });
    return res.data.data.galleryImages as GalleryImageDto[];
  },

  creatorGalleryDelete: async (creatorId: string, imageId: string) => {
    const res = await agencyApi.delete(`/admin/creators/${creatorId}/gallery/${imageId}`);
    return res.data.data.galleryImages as GalleryImageDto[];
  },

  creatorGalleryReorder: async (creatorId: string, imageIds: string[]) => {
    const res = await agencyApi.patch(`/admin/creators/${creatorId}/gallery/reorder`, { imageIds });
    return res.data.data.galleryImages as GalleryImageDto[];
  },
};
