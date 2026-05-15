import type { AxiosInstance } from 'axios';

export type StaffPayoutAccount = {
  accountHolderName: string;
  accountNumber: string | null;
  ifsc: string | null;
  upi: string | null;
  phone: string | null;
  isComplete: boolean;
  updatedAt: string;
};

export type StaffWalletSummary = {
  balance: number;
  totalEarningsCoins: number;
  totalWithdrawnCoins: number;
  pendingWithdrawalCount: number;
  payoutAccount: StaffPayoutAccount | null;
  payoutAccountBound: boolean;
};

export type StaffWalletTransaction = {
  id: string;
  direction: 'credit' | 'debit';
  amountCoins: number;
  balanceAfter: number | null;
  sourceType: string;
  callId: string | null;
  description: string;
  withdrawalId: string | null;
  createdAt: string;
};

export type StaffWalletWithdrawal = {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
  payout: {
    accountHolderName: string | null;
    phone: string | null;
    upi: string | null;
    accountNumber: string | null;
    ifsc: string | null;
  };
};

export function createStaffWalletService(api: AxiosInstance, basePath: '/agency' | '/bd') {
  const prefix = `${basePath}/wallet`;
  return {
    getSummary: async (): Promise<StaffWalletSummary> => {
      const res = await api.get(prefix);
      return res.data.data as StaffWalletSummary;
    },
    getTransactions: async (params?: { page?: number; limit?: number }) => {
      const res = await api.get(`${prefix}/transactions`, { params });
      return res.data.data as {
        transactions: StaffWalletTransaction[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
    getWithdrawals: async (params?: { page?: number; limit?: number; status?: string }) => {
      const res = await api.get(`${prefix}/withdrawals`, { params });
      return res.data.data as {
        withdrawals: StaffWalletWithdrawal[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
    savePayoutAccount: async (body: {
      accountHolderName: string;
      accountNumber?: string;
      ifsc?: string;
      upi?: string;
      phone?: string;
    }) => {
      const res = await api.put(`${prefix}/payout-account`, body);
      return res.data.data.payoutAccount as StaffPayoutAccount;
    },
    requestWithdrawal: async (amount: number) => {
      const res = await api.post(`${prefix}/withdrawals`, { amount });
      return res.data.data as { id: string; amount: number; status: string; requestedAt: string };
    },
  };
}
