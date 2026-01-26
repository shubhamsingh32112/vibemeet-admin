import api from '../config/api';

export type User = {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  role: string;
  avatar?: string;
  createdAt: string;
  isCreator?: boolean; // Flag indicating if user already has creator profile
};

export type PromoteToCreatorDto = {
  name: string;
  about: string;
  photo: string;
  categories?: string[];
  price: number;
};

export const userService = {
  search: async (query?: string, role?: string): Promise<User[]> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (role) params.append('role', role);
    
    const response = await api.get(`/user/search?${params.toString()}`);
    return response.data.data.users;
  },

  promoteToCreator: async (userId: string, data: PromoteToCreatorDto) => {
    const response = await api.post(`/user/${userId}/promote-to-creator`, data);
    return response.data.data;
  },
};
