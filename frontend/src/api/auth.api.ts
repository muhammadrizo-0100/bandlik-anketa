import { apiClient } from './client';
import { AuthResponse, LoginDto, User } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    return apiClient.post('/auth/login', credentials);
  },

  getProfile: async (): Promise<User> => {
    return apiClient.get('/users/profile/me');
  },
};
