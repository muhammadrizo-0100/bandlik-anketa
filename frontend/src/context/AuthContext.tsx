import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginDto } from '../types/auth.types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isDistrictAdmin: boolean;
  isMahallaOperator: boolean;
  isDataReviewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (userData: any): User | null => {
  if (!userData) return null;
  const roleCode =
    typeof userData.role === 'object' && userData.role !== null
      ? userData.role.code
      : userData.roleCode || userData.role;
  const roleName =
    typeof userData.role === 'object' && userData.role !== null
      ? userData.role.name
      : userData.roleName || roleCode;
  const districtName =
    typeof userData.district === 'object' && userData.district !== null
      ? userData.district.name
      : userData.districtName || '';
  const mahallaName =
    typeof userData.mahalla === 'object' && userData.mahalla !== null
      ? userData.mahalla.name
      : userData.mahallaName || '';

  return {
    ...userData,
    role: roleCode,
    roleCode: roleCode,
    roleName: roleName,
    districtId: userData.districtId || (typeof userData.district === 'object' ? userData.district?.id : undefined),
    districtName: districtName,
    mahallaId: userData.mahallaId || (typeof userData.mahalla === 'object' ? userData.mahalla?.id : undefined),
    mahallaName: mahallaName,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('monitoring_user');
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('monitoring_token'),
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await authApi.getProfile();
          const normalized = normalizeUser(profile);
          setUser(normalized);
          localStorage.setItem('monitoring_user', JSON.stringify(normalized));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (credentials: LoginDto) => {
    // Har yangi tizimga kirishda oldingi sessiya filtrlarini tozalab, default holatga keltirish
    localStorage.removeItem('global_selected_district_id');
    localStorage.removeItem('global_selected_mahalla_id');

    const res = await authApi.login(credentials);
    const normalized = normalizeUser(res.user);
    setUser(normalized);
    setToken(res.tokens.accessToken);
    localStorage.setItem('token', res.tokens.accessToken);
    localStorage.setItem('monitoring_token', res.tokens.accessToken);
    localStorage.setItem('monitoring_user', JSON.stringify(normalized));
    return normalized;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('monitoring_token');
    localStorage.removeItem('monitoring_user');
    localStorage.removeItem('global_selected_district_id');
    localStorage.removeItem('global_selected_mahalla_id');
  };

  const userRole = user?.roleCode || (typeof user?.role === 'string' ? user.role : (user?.role as any)?.code);
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isDistrictAdmin = userRole === 'DISTRICT_ADMIN';
  const isMahallaOperator = userRole === 'MAHALLA_OPERATOR';
  const isDataReviewer = userRole === 'DATA_REVIEWER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token,
        isSuperAdmin,
        isDistrictAdmin,
        isMahallaOperator,
        isDataReviewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
