import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  FilePlus,
  AlertTriangle,
  Building2,
  UserCheck,
  UserCog,
  LogOut,
  ChevronDown,
  Layers,
  MapPin,
  Check,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAreaFilter } from '../../context/AreaFilterContext';
import { useSidebar } from '../../context/SidebarContext';
import { monitoringApi } from '../../api/monitoring.api';
import { realtimeService } from '../../services/realtime.service';

interface SidebarProps {
  selectedDistrictId?: string;
  onDistrictChange?: (districtId: string) => void;
  isMobileDrawer?: boolean;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedDistrictId: propDistrictId,
  onDistrictChange: propOnDistrictChange,
  isMobileDrawer = false,
  pendingCount: propPendingCount,
}) => {
  const areaFilter = useAreaFilter();
  const { isCollapsed: contextCollapsed, toggleSidebar, closeMobileDrawer } = useSidebar();
  const isCollapsed = isMobileDrawer ? false : contextCollapsed;

  const selectedDistrictId = propDistrictId !== undefined ? propDistrictId : areaFilter.selectedDistrictId;
  const onDistrictChange = (id: string) => {
    areaFilter.setSelectedDistrictId(id);
    if (propOnDistrictChange) {
      propOnDistrictChange(id);
    }
  };

  const {
    user,
    logout,
    isSuperAdmin,
    isDistrictAdmin,
    isMahallaOperator,
    isDataReviewer,
  } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [internalPendingCount, setInternalPendingCount] = useState<number>(0);
  const effectivePendingCount = propPendingCount !== undefined ? propPendingCount : internalPendingCount;
  const districts = areaFilter.districts;
  const [districtSearch, setDistrictSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchPending = () => {
      if (isDataReviewer || isSuperAdmin || isDistrictAdmin) {
        monitoringApi
          .getReviewQueueCount()
          .then((res) => {
            if (res && typeof res.count === 'number') {
              setInternalPendingCount(res.count);
            }
          })
          .catch(() => {});
      }
    };

    fetchPending();

    // Real-time yangi arizalarni qabul qilish
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type === 'NEW_SURVEY') {
        setInternalPendingCount((prev) => prev + 1);
        fetchPending();
      }
    });

    const interval = setInterval(fetchPending, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isDataReviewer, isSuperAdmin, isDistrictAdmin]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    areaFilter.clearFilters();
    logout();
    toast.info('Tizimdan muvaffaqiyatli chiqildi');
    navigate('/login');
  };

  const getRoleDisplayName = () => {
    const roleCode = user?.roleCode || user?.role;
    switch (roleCode) {
      case 'SUPER_ADMIN':
        return 'Bosh Administrator';
      case 'DISTRICT_ADMIN':
        return 'Tuman Boshligʻi';
      case 'MAHALLA_OPERATOR':
        return 'Mahalla Yetakchisi';
      case 'DATA_REVIEWER':
        return 'Data Reviewer';
      default:
        return 'Xodim';
    }
  };

  const currentDistrictName = () => {
    if (isSuperAdmin) {
      if (!selectedDistrictId) return 'Barcha tumanlar';
      const found = districts.find((d) => d.id === selectedDistrictId);
      return found ? found.name : 'Barcha tumanlar';
    }
    if (isDistrictAdmin) {
      return user?.districtName || 'Tuman';
    }
    if (isMahallaOperator) {
      return user?.mahallaName
        ? (user.mahallaName.includes('MFY') ? user.mahallaName : `${user.mahallaName} MFY`)
        : 'Mahalla';
    }
    if (isDataReviewer) {
      return 'Tekshiruv Markazi';
    }
    return 'Bandlik Agentligi';
  };

  // NavLink stil formati
  const getNavLinkClass = (isActive: boolean) => {
    if (isCollapsed) {
      return `flex items-center justify-center w-11 h-11 mx-auto rounded-2xl transition duration-150 relative group ${
        isActive
          ? 'bg-[#163D5C]/10 border border-[#163D5C]/20 text-[#163D5C] font-bold shadow-xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
      }`;
    }
    return `flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl transition duration-150 text-[13px] ${
      isActive
        ? 'bg-[#163D5C]/10 backdrop-blur-md border border-[#163D5C]/20 text-[#163D5C] font-bold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
    }`;
  };

  const renderSectionHeader = (title: string) => {
    if (isCollapsed) {
      return <div className="my-2 mx-3 border-t border-slate-100" />;
    }
    return (
      <div className="pt-3 pb-1 px-3">
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
    );
  };

  const renderNavItem = (
    to: string,
    label: string,
    Icon: React.ElementType,
    badgeCount?: number,
    customIconColor?: string,
  ) => (
    <NavLink
      key={to}
      to={to}
      onClick={() => {
        if (isMobileDrawer) {
          closeMobileDrawer();
        }
      }}
      className={({ isActive }) => getNavLinkClass(isActive)}
      title={isCollapsed ? (badgeCount && badgeCount > 0 ? `${label} (${badgeCount})` : label) : undefined}
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
              customIconColor && !isActive
                ? customIconColor
                : isActive
                ? 'text-[#163D5C]'
                : 'text-slate-500'
            }`}
          />
          {!isCollapsed && <span className="truncate">{label}</span>}
          {badgeCount !== undefined && badgeCount > 0 && (
            !isCollapsed ? (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shadow-xs flex-shrink-0 animate-pulse">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <aside className="w-full h-full bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200/80 flex-shrink-0 select-none overflow-y-auto overflow-x-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative transition-all duration-300">
      {/* Yuqori qism: Logo, Hudud tanlagich va Menyu */}
      <div>
        {/* 1. Brand Logo */}
        {!isCollapsed ? (
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-[#163D5C] flex items-center justify-center shadow-md shadow-[#163D5C]/20 text-white flex-shrink-0">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <div className="flex items-center space-x-1.5">
                  <h1 className="text-base font-bold text-[#163D5C] tracking-tight">
                    Bandlik
                  </h1>
                  <span className="text-[10px] font-bold bg-[#163D5C]/10 text-[#163D5C] px-1.5 py-0.5 rounded-md">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">Monitoring & Tahlil</p>
              </div>
            </div>

            {/* Mobile Drawer yopish tugmasi (X) */}
            {isMobileDrawer && (
              <button
                type="button"
                onClick={closeMobileDrawer}
                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer flex-shrink-0 ml-2"
                title="Menyuni yopish"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 border-b border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-10 h-10 rounded-2xl bg-[#163D5C] flex items-center justify-center shadow-md shadow-[#163D5C]/20 text-white flex-shrink-0 hover:opacity-90 transition cursor-pointer"
              title="Bandlik v1.0 - Kattalashtirish (>)"
            >
              <Layers className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* 2. Faoliyat Hududi */}
        {!isCollapsed ? (
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Faoliyat Hududi
            </p>
            <div className="relative">
              <button
                type="button"
                onClick={() => isSuperAdmin && setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition ${
                  isSuperAdmin
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-800 cursor-pointer'
                    : 'bg-slate-50/80 border-slate-200/70 text-slate-800 cursor-default'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="w-7 h-7 rounded-xl bg-[#163D5C]/10 border border-[#163D5C]/20 text-[#163D5C] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left truncate">
                    <span className="block text-xs font-bold text-slate-900 truncate">
                      {currentDistrictName()}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium truncate">
                      {isMahallaOperator
                        ? user?.districtName || 'Namangan viloyati'
                        : 'Namangan viloyati'}
                    </span>
                  </div>
                </div>
                {isSuperAdmin && (
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Super Admin Tuman Tanlash Dropdowni */}
              {isSuperAdmin && isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Tumanni qidirish..."
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#163D5C] text-slate-800 placeholder-slate-400 font-medium"
                    />
                    {districtSearch && (
                      <button
                        type="button"
                        onClick={() => setDistrictSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        onDistrictChange && onDistrictChange('');
                        setIsDropdownOpen(false);
                        setDistrictSearch('');
                      }}
                      className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center gap-2 rounded-xl transition ${
                        !selectedDistrictId
                          ? 'font-bold text-[#163D5C] bg-[#163D5C]/10 border border-[#163D5C]/20'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {!selectedDistrictId && (
                          <Check className="w-4 h-4 text-[#163D5C] stroke-[2.5]" />
                        )}
                      </div>
                      <span>Barcha tumanlar</span>
                    </button>

                    {districts
                      .filter((d) =>
                        d.name.toLowerCase().includes(districtSearch.toLowerCase().trim()),
                      )
                      .map((d) => {
                        const isSelected = selectedDistrictId === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              onDistrictChange && onDistrictChange(d.id);
                              setIsDropdownOpen(false);
                              setDistrictSearch('');
                            }}
                            className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center gap-2 rounded-xl transition ${
                              isSelected
                                ? 'font-bold text-[#163D5C] bg-[#163D5C]/10 border border-[#163D5C]/20'
                                : 'text-slate-600 hover:bg-slate-50 font-medium'
                            }`}
                          >
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#163D5C] stroke-[2.5]" />
                              )}
                            </div>
                            <span className="truncate">{d.name}</span>
                          </button>
                        );
                      })}

                    {districts.filter((d) =>
                      d.name.toLowerCase().includes(districtSearch.toLowerCase().trim()),
                    ).length === 0 && (
                      <div className="px-3 py-3 text-center text-xs text-slate-400">
                        Tuman topilmadi
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-2 pt-3 pb-2 flex flex-col items-center">
            <button
              type="button"
              onClick={() => isSuperAdmin && setIsDropdownOpen(!isDropdownOpen)}
              title={`Faoliyat Hududi: ${currentDistrictName()}`}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition relative ${
                isSuperAdmin
                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800 cursor-pointer'
                  : 'bg-slate-50/80 border-slate-200/70 text-slate-800 cursor-default'
              }`}
            >
              <div className="w-7 h-7 rounded-xl bg-[#163D5C]/10 border border-[#163D5C]/20 text-[#163D5C] flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Super Admin Tuman Tanlash Floating Dropdown (Collapsed holatda) */}
            {isSuperAdmin && isDropdownOpen && (
              <div className="fixed left-20 ml-2 top-20 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2.5 w-64 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Tumanni qidirish..."
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#163D5C] text-slate-800 placeholder-slate-400 font-medium"
                  />
                  {districtSearch && (
                    <button
                      type="button"
                      onClick={() => setDistrictSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDistrictChange && onDistrictChange('');
                      setIsDropdownOpen(false);
                      setDistrictSearch('');
                    }}
                    className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center gap-2 rounded-xl transition ${
                      !selectedDistrictId
                        ? 'font-bold text-[#163D5C] bg-[#163D5C]/10 border border-[#163D5C]/20'
                        : 'text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {!selectedDistrictId && (
                        <Check className="w-4 h-4 text-[#163D5C] stroke-[2.5]" />
                      )}
                    </div>
                    <span>Barcha tumanlar</span>
                  </button>

                  {districts
                    .filter((d) =>
                      d.name.toLowerCase().includes(districtSearch.toLowerCase().trim()),
                    )
                    .map((d) => {
                      const isSelected = selectedDistrictId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            onDistrictChange && onDistrictChange(d.id);
                            setIsDropdownOpen(false);
                            setDistrictSearch('');
                          }}
                          className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center gap-2 rounded-xl transition ${
                            isSelected
                              ? 'font-bold text-[#163D5C] bg-[#163D5C]/10 border border-[#163D5C]/20'
                              : 'text-slate-600 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#163D5C] stroke-[2.5]" />
                            )}
                          </div>
                          <span className="truncate">{d.name}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Menyu Bo'limlari */}
        <nav className="p-3 space-y-1">
          {/* ======================================================== */}
          {/* A. SUPER ADMIN KABINETI */}
          {/* ======================================================== */}
          {isSuperAdmin && (
            <>
              {renderSectionHeader('Kunlik ish')}
              {renderNavItem('/dashboard', 'Boshqaruv paneli', LayoutDashboard)}
              {renderNavItem('/new-survey', 'Yangi soʻrovnoma', FilePlus)}
              {renderNavItem('/citizens', 'Fuqarolar reyestri', Users)}
              {renderNavItem('/surveys', 'Soʻrovnomalar jurnali', FileSpreadsheet)}
              {renderNavItem('/review-queue', 'Tekshiruv navbati', AlertTriangle, effectivePendingCount, 'text-amber-500')}

              {renderSectionHeader('Tizim boshqaruvi')}
              {renderNavItem('/mahallas', 'Tuman & Mahallalar', Building2)}
              {renderNavItem('/users', 'Xodimlar & Rollar', UserCog)}
            </>
          )}

          {/* ======================================================== */}
          {/* B. DISTRICT ADMIN (TUMAN BOSHLIG'I) KABINETI */}
          {/* ======================================================== */}
          {isDistrictAdmin && (
            <>
              {renderSectionHeader('Kunlik ish')}
              {renderNavItem('/dashboard', 'Boshqaruv paneli', LayoutDashboard)}
              {renderNavItem('/new-survey', 'Yangi soʻrovnoma', FilePlus)}
              {renderNavItem('/citizens', 'Tuman yoshlari', Users)}
              {renderNavItem('/surveys', 'Tuman soʻrovnomalari', FileSpreadsheet)}
              {renderNavItem('/review-queue', 'Tekshiruv navbati', AlertTriangle, effectivePendingCount, 'text-amber-500')}

              {renderSectionHeader('Tuman boshqaruvi')}
              {renderNavItem('/mahallas', 'Mahallalar', Building2)}
              {renderNavItem('/users', 'Mahalla yetakchilari', UserCheck)}
            </>
          )}

          {/* ======================================================== */}
          {/* C. MAHALLA OPERATORI (YETAKCHI) KABINETI */}
          {/* ======================================================== */}
          {isMahallaOperator && (
            <>
              {renderSectionHeader('Kunlik ish')}
              {renderNavItem('/dashboard', 'Boshqaruv paneli', LayoutDashboard)}
              {renderNavItem('/new-survey', 'Yangi soʻrovnoma', FilePlus)}
              {renderNavItem('/surveys', 'Soʻrovnomalar jurnali', FileSpreadsheet)}
              {renderNavItem('/citizens', 'Mahalla yoshlari', Users)}
            </>
          )}

          {/* ======================================================== */}
          {/* D. DATA REVIEWER (MA'LUMOT TEKSHIRUVCHI) KABINETI */}
          {/* ======================================================== */}
          {isDataReviewer && (
            <>
              {renderSectionHeader('Kunlik ish')}
              {renderNavItem('/review-queue', 'Tekshiruv navbati', AlertTriangle, effectivePendingCount, 'text-amber-500')}
              {renderNavItem('/dashboard', 'Boshqaruv paneli', LayoutDashboard)}
              {renderNavItem('/citizens', 'Fuqarolar reyestri', Users)}
              {renderNavItem('/surveys', 'Soʻrovnomalar jurnali', FileSpreadsheet)}
            </>
          )}
        </nav>
      </div>

      {/* 4. Pastki qism: Xodim ma'lumoti va Chiqish */}
      {!isCollapsed ? (
        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* User Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="w-9 h-9 rounded-xl bg-[#163D5C] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="truncate flex-1">
              <span className="block text-xs font-bold text-slate-800 truncate">
                {user?.fullName}
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold truncate">
                {getRoleDisplayName()}
              </span>
            </div>
          </div>

          {/* Chiqish Tugmasi */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer text-[13px] font-medium"
          >
            <LogOut className="w-[18px] h-[18px] text-slate-500" />
            <span>Chiqish</span>
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-100 flex flex-col items-center gap-2">
          {/* User Card (compact) */}
          <div
            title={`${user?.fullName} (${getRoleDisplayName()})`}
            className="w-10 h-10 rounded-2xl bg-[#163D5C] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs cursor-pointer"
          >
            {user?.fullName?.charAt(0) || 'U'}
          </div>

          {/* Chiqish Tugmasi (compact) */}
          <button
            type="button"
            onClick={handleLogout}
            title="Tizimdan chiqish"
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      )}

      {/* Chiqishni tasdiqlash modali */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <LogOut className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Tizimdan chiqishni tasdiqlaysizmi?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Joriy ish sessiyangiz yakunlanadi. Qayta kirish uchun login va parolingizni kiritishingiz kerak boʻladi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Ha, chiqish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
