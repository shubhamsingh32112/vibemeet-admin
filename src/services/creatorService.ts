import api from '../config/api';
import type { Creator, CreateCreatorDto } from '../types/creator';

export const creatorService = {
  getAll: async (): Promise<Creator[]> => {
    const response = await api.get('/creator');
    return response.data.data.creators;
  },

  getById: async (id: string): Promise<Creator> => {
    const response = await api.get(`/creator/${id}`);
    return response.data.data.creator;
  },

  create: async (data: CreateCreatorDto): Promise<Creator> => {
    const response = await api.post('/creator', data);
    return response.data.data.creator;
  },

  // Note: Use userService.promoteToCreator instead for promoting users

  update: async (id: string, data: Partial<CreateCreatorDto>): Promise<Creator> => {
    const response = await api.put(`/creator/${id}`, data);
    return response.data.data.creator;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/creator/${id}`);
  },
};
