import type { AxiosInstance } from 'axios';

export interface StaffSupportTicket {
  id: string;
  role: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  source?: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function createStaffSupportService(api: AxiosInstance) {
  return {
    getMyTickets: async (): Promise<StaffSupportTicket[]> => {
      const res = await api.get('/support/my-tickets');
      return res.data.data.tickets as StaffSupportTicket[];
    },

    createTicket: async (body: {
      category: string;
      subject: string;
      message: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }) => {
      const res = await api.post('/support/ticket', {
        ...body,
        source: 'staff_portal',
      });
      return res.data.data as {
        ticketId: string;
        status: string;
        priority: string;
        createdAt: string;
      };
    },
  };
}
