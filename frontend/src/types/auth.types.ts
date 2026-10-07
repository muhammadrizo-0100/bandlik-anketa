export type UserRole =
  | 'SUPER_ADMIN'
  | 'DISTRICT_ADMIN'
  | 'MAHALLA_OPERATOR'
  | 'DATA_REVIEWER';

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  roleCode?: string;
  roleName?: string;
  districtId?: string;
  districtName?: string;
  mahallaId?: string;
  mahallaName?: string;
  isActive: boolean;
  surveysCount?: number;
  reviewedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginDto {
  username: string;
  password: string;
}
