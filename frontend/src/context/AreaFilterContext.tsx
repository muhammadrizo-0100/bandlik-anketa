import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { monitoringApi } from '../api/monitoring.api';

export interface DistrictOption {
  id: string;
  name: string;
  code?: string;
  region?: string;
}

interface AreaFilterContextType {
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;
  selectedMahallaId: string;
  setSelectedMahallaId: (id: string) => void;
  clearFilters: () => void;
  districts: DistrictOption[];
  currentDistrictName: string;
}

const AreaFilterContext = createContext<AreaFilterContextType | undefined>(undefined);

export const AreaFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSuperAdmin, isDistrictAdmin, isMahallaOperator, isDataReviewer } = useAuth();

  const [districts, setDistricts] = useState<DistrictOption[]>([]);

  useEffect(() => {
    if (user) {
      monitoringApi
        .getDistrictsDropdown()
        .then((res) => {
          if (Array.isArray(res)) {
            setDistricts(res);
          }
        })
        .catch(() => {});
    } else {
      setDistricts([]);
    }
  }, [user]);

  const [selectedDistrictId, setSelectedDistrictIdState] = useState<string>(() => {
    return localStorage.getItem('global_selected_district_id') || '';
  });

  const [selectedMahallaId, setSelectedMahallaIdState] = useState<string>(() => {
    return localStorage.getItem('global_selected_mahalla_id') || '';
  });

  // Oldingi user ID sini saqlab turish (Logout yoki Yangi Login holatini aniqlash uchun)
  const prevUserRef = useRef<string | null>(user?.id || null);

  useEffect(() => {
    const prevUserId = prevUserRef.current;
    const currentUserId = user?.id || null;

    if (!user) {
      // User tizimdan chiqqan (Logout)
      setSelectedDistrictIdState('');
      setSelectedMahallaIdState('');
      localStorage.removeItem('global_selected_district_id');
      localStorage.removeItem('global_selected_mahalla_id');
    } else if (prevUserId !== currentUserId) {
      // Yangi foydalanuvchi tizimga kirdi (Login)
      if (isDistrictAdmin && user?.districtId) {
        setSelectedDistrictIdState(user.districtId);
        localStorage.setItem('global_selected_district_id', user.districtId);
      } else if (isMahallaOperator) {
        if (user?.districtId) {
          setSelectedDistrictIdState(user.districtId);
          localStorage.setItem('global_selected_district_id', user.districtId);
        }
        if (user?.mahallaId) {
          setSelectedMahallaIdState(user.mahallaId);
          localStorage.setItem('global_selected_mahalla_id', user.mahallaId);
        }
      } else {
        // Super Admin yoki boshqa rollar yangi kirganda default holat (Barcha tumanlar)
        setSelectedDistrictIdState('');
        setSelectedMahallaIdState('');
        localStorage.removeItem('global_selected_district_id');
        localStorage.removeItem('global_selected_mahalla_id');
      }
    } else {
      // O'sha bir xil user davom etmoqda (masalan oddiy sahifa renderi yoki F5 refreshdan keyin)
      if (isDistrictAdmin && user?.districtId && !selectedDistrictId) {
        setSelectedDistrictIdState(user.districtId);
        localStorage.setItem('global_selected_district_id', user.districtId);
      } else if (isMahallaOperator) {
        if (user?.districtId && !selectedDistrictId) {
          setSelectedDistrictIdState(user.districtId);
          localStorage.setItem('global_selected_district_id', user.districtId);
        }
        if (user?.mahallaId && !selectedMahallaId) {
          setSelectedMahallaIdState(user.mahallaId);
          localStorage.setItem('global_selected_mahalla_id', user.mahallaId);
        }
      }
    }

    prevUserRef.current = currentUserId;
  }, [user, isSuperAdmin, isDistrictAdmin, isMahallaOperator]);

  const setSelectedDistrictId = (id: string) => {
    setSelectedDistrictIdState(id);
    if (id) {
      localStorage.setItem('global_selected_district_id', id);
    } else {
      localStorage.removeItem('global_selected_district_id');
    }
    // Tumanni o'zgartirganda mahallani tozalash
    setSelectedMahallaIdState('');
    localStorage.removeItem('global_selected_mahalla_id');
  };

  const setSelectedMahallaId = (id: string) => {
    setSelectedMahallaIdState(id);
    if (id) {
      localStorage.setItem('global_selected_mahalla_id', id);
    } else {
      localStorage.removeItem('global_selected_mahalla_id');
    }
  };

  const clearFilters = () => {
    setSelectedDistrictIdState('');
    setSelectedMahallaIdState('');
    localStorage.removeItem('global_selected_district_id');
    localStorage.removeItem('global_selected_mahalla_id');
  };

  const currentDistrictName = useMemo(() => {
    if (isMahallaOperator) {
      return user?.mahallaName
        ? (user.mahallaName.includes('MFY') ? user.mahallaName : `${user.mahallaName} MFY`)
        : user?.districtName || 'Mahalla';
    }
    if (isDistrictAdmin) {
      return user?.districtName || 'Tuman';
    }
    if (isDataReviewer) {
      return user?.districtName || 'Tekshiruv Markazi';
    }
    if (isSuperAdmin) {
      if (!selectedDistrictId) return 'Barcha tumanlar';
      const found = districts.find((d) => d.id === selectedDistrictId);
      return found ? found.name : 'Barcha tumanlar';
    }
    return user?.districtName || 'Barcha tumanlar';
  }, [isMahallaOperator, isDistrictAdmin, isDataReviewer, isSuperAdmin, selectedDistrictId, districts, user]);

  return (
    <AreaFilterContext.Provider
      value={{
        selectedDistrictId,
        setSelectedDistrictId,
        selectedMahallaId,
        setSelectedMahallaId,
        clearFilters,
        districts,
        currentDistrictName,
      }}
    >
      {children}
    </AreaFilterContext.Provider>
  );
};

export const useAreaFilter = () => {
  const context = useContext(AreaFilterContext);
  if (!context) {
    throw new Error('useAreaFilter must be used within an AreaFilterProvider');
  }
  return context;
};
