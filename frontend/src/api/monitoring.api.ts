import { apiClient } from './client';
import {
  DashboardSummary,
  Citizen,
  Survey,
  Mahalla,
  CreateSurveyInput,
  PaginatedResult,
} from '../types/monitoring.types';
import { User } from '../types/auth.types';

export const monitoringApi = {
  // --- DASHBOARD ---
  getDashboardSummary: async (params?: {
    districtId?: string;
    mahallaId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardSummary> => {
    return apiClient.get('/dashboard/summary', { params });
  },

  // --- TUMANLAR (DISTRICTS) ---
  getDistrictsDropdown: async (): Promise<Array<{ id: string; name: string; code?: string; region: string; assignedAdmin?: { id: string; fullName: string; username: string } | null }>> => {
    return apiClient.get('/districts/dropdown');
  },

  getDistricts: async (): Promise<Array<{ id: string; name: string; code?: string; region: string; isActive: boolean; mahallas?: any[] }>> => {
    return apiClient.get('/districts');
  },

  createDistrict: async (data: { name: string; region?: string; code?: string }): Promise<any> => {
    return apiClient.post('/districts', data);
  },

  // --- SO'ROVNOMALAR (SURVEYS) ---
  createSurvey: async (data: CreateSurveyInput): Promise<{
    isConflict: boolean;
    message: string;
    survey: Survey;
    citizen?: Citizen;
  }> => {
    return apiClient.post('/surveys', data);
  },

  submitPublicSurvey: async (data: CreateSurveyInput): Promise<{
    isConflict: boolean;
    message: string;
    survey?: Survey;
  }> => {
    return apiClient.post('/surveys/public', data);
  },

  getSurveys: async (params?: any): Promise<PaginatedResult<Survey>> => {
    return apiClient.get('/surveys', { params });
  },

  getSurveyById: async (id: string): Promise<Survey> => {
    return apiClient.get(`/surveys/${id}`);
  },

  // --- FUQAROLAR (CITIZENS) ---
  getCitizens: async (params?: any): Promise<PaginatedResult<Citizen>> => {
    return apiClient.get('/citizens', { params });
  },

  checkPinfl: async (pinfl: string): Promise<Citizen | null> => {
    return apiClient.get(`/citizens/check-pinfl/${pinfl}`);
  },

  getCitizenById: async (id: string): Promise<Citizen> => {
    return apiClient.get(`/citizens/${id}`);
  },

  updateCitizen: async (id: string, data: any): Promise<Citizen> => {
    return apiClient.patch(`/citizens/${id}`, data);
  },

  deleteCitizen: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete(`/citizens/${id}`);
  },

  // --- DATA REVIEWER QUEUE ---
  getReviewQueue: async (params?: any): Promise<PaginatedResult<Survey>> => {
    return apiClient.get('/review-queue', { params });
  },

  getReviewQueueCount: async (): Promise<{ count: number }> => {
    return apiClient.get('/review-queue/count');
  },

  getReviewQueueItem: async (id: string): Promise<{
    pendingSurvey: Survey;
    existingCitizen: Citizen;
  }> => {
    return apiClient.get(`/review-queue/${id}`);
  },

  resolveReviewItem: async (
    id: string,
    data: { action: 'APPROVE_UPDATE' | 'REJECT'; reviewerNote?: string },
  ): Promise<any> => {
    return apiClient.post(`/review-queue/${id}/resolve`, data);
  },

  // --- MAHALLALAR (MAHALLAS) ---
  getMahallas: async (params?: any): Promise<PaginatedResult<Mahalla>> => {
    return apiClient.get('/mahallas', { params });
  },

  getMahallasDropdown: async (districtId?: string): Promise<Array<{ id: string; name: string; districtId?: string; assignedOperator?: { id: string; fullName: string; username: string } | null }>> => {
    return apiClient.get('/mahallas/dropdown', { params: { districtId } });
  },

  createMahalla: async (data: { name: string; district?: string; region?: string; code?: string }): Promise<Mahalla> => {
    return apiClient.post('/mahallas', data);
  },

  updateMahalla: async (id: string, data: any): Promise<Mahalla> => {
    return apiClient.patch(`/mahallas/${id}`, data);
  },

  deleteMahalla: async (id: string): Promise<void> => {
    return apiClient.delete(`/mahallas/${id}`);
  },

  // --- XODIMLAR (USERS) ---
  getUsers: async (params?: any): Promise<PaginatedResult<User>> => {
    return apiClient.get('/users', { params });
  },

  getUserById: async (id: string): Promise<User> => {
    return apiClient.get(`/users/${id}`);
  },

  createUser: async (data: any): Promise<User> => {
    return apiClient.post('/users', data);
  },

  updateUser: async (id: string, data: any): Promise<User> => {
    return apiClient.patch(`/users/${id}`, data);
  },

  deleteUser: async (id: string): Promise<void> => {
    return apiClient.delete(`/users/${id}`);
  },

  getRoles: async (): Promise<Array<{ id: number; code: string; name: string; description: string }>> => {
    return apiClient.get('/roles');
  },
};
